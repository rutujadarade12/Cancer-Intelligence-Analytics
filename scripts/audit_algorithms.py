import sqlite3
import json
import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression, Ridge
from sklearn.tree import DecisionTreeClassifier, export_text
from sklearn.naive_bayes import GaussianNB
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import (
    mean_squared_error, mean_absolute_error, r2_score,
    confusion_matrix, accuracy_score, f1_score, precision_score, recall_score,
    silhouette_score
)
from scipy.cluster.hierarchy import linkage, cophenet
from scipy.spatial.distance import pdist

DB_PATH = "warehouse/cancer_dw.db"

def audit_all():
    con = sqlite3.connect(DB_PATH)
    
    print("="*60)
    print("AUDIT PHASE 2: ALGORITHMS VERIFICATION")
    print("="*60)
    
    # ----------------------------------------------------
    # A. REGRESSION
    # ----------------------------------------------------
    print("\n--- 1. REGRESSION AUDIT ---")
    df_reg = pd.read_sql_query("""
        SELECT f.geo_id, g.state_name, g.region_zone, t.year, f.incident_cases
        FROM Fact_State_Surveillance f
        JOIN Dim_Geography g ON f.geo_id = g.geo_id
        JOIN Dim_Time t ON f.time_id = t.time_id
        WHERE t.year IN (2019, 2020, 2021, 2022, 2026)
        ORDER BY f.geo_id, t.year
    """, con)
    piv = df_reg.pivot(index='geo_id', columns='year', values='incident_cases').reset_index()
    meta = df_reg[['geo_id', 'state_name', 'region_zone']].drop_duplicates().reset_index(drop=True)
    piv = pd.merge(piv, meta, on='geo_id')
    
    X_train = piv[[2019, 2020, 2021]].values
    y_train = piv[2022].values
    
    lr = LinearRegression()
    lr.fit(X_train, y_train)
    y_pred_lr = lr.predict(X_train)
    
    mae_lr = mean_absolute_error(y_train, y_pred_lr)
    rmse_lr = np.sqrt(mean_squared_error(y_train, y_pred_lr))
    r2_lr = r2_score(y_train, y_pred_lr)
    
    print(f"OLS Linear In-Sample (2022 from 2019-2021):")
    print(f"  Coefficients: {lr.coef_}, Intercept: {lr.intercept_:.4f}")
    print(f"  MAE: {mae_lr:.4f}, RMSE: {rmse_lr:.4f}, R2: {r2_lr:.6f}")
    
    # Forecast out-of-sample 2026
    X_forecast = piv[[2020, 2021, 2022]].values
    y_pred_2026 = lr.predict(X_forecast)
    y_kumar_2026 = piv[2026].values
    mae_2026 = mean_absolute_error(y_kumar_2026, y_pred_2026)
    rmse_2026 = np.sqrt(mean_squared_error(y_kumar_2026, y_pred_2026))
    r2_2026 = r2_score(y_kumar_2026, y_pred_2026)
    print(f"2026 Forecast Out-Of-Sample (vs Kumar 2026):")
    print(f"  MAE: {mae_2026:.4f}, RMSE: {rmse_2026:.4f}, R2: {r2_2026:.6f}")
    
    # Check why R2 is 1.0: Check correlation between 2021 and 2022
    corr = np.corrcoef(piv[2021], piv[2022])[0, 1]
    print(f"  Pearson correlation (2021 vs 2022): {corr:.6f}")
    r_rates = (piv[2022] - piv[2021]) / piv[2021]
    print(f"  Mean growth rate 2021->2022: {r_rates.mean():.4f}, Std: {r_rates.std():.6f}")
    print(f"  Min growth rate: {r_rates.min():.4f}, Max: {r_rates.max():.4f}")
    
    # ----------------------------------------------------
    # B. DECISION TREE
    # ----------------------------------------------------
    print("\n--- 2. DECISION TREE AUDIT ---")
    df_dt = pd.read_sql_query("""
        SELECT g.state_name, g.region_zone, f.incident_cases, f.cagr_observed, f.cagr_projected
        FROM Fact_State_Surveillance f
        JOIN Dim_Geography g ON f.geo_id = g.geo_id
        WHERE f.time_id = 2022
    """, con)
    
    q1 = df_dt['incident_cases'].quantile(0.25)
    q2 = df_dt['incident_cases'].quantile(0.50)
    q3 = df_dt['incident_cases'].quantile(0.75)
    
    def assign_tier(c):
        if c <= q1: return "Tier_1_Low"
        elif c <= q2: return "Tier_2_Moderate"
        elif c <= q3: return "Tier_3_High"
        else: return "Tier_4_Severe"
        
    df_dt['burden_tier'] = df_dt['incident_cases'].apply(assign_tier)
    region_dummies = pd.get_dummies(df_dt['region_zone'], prefix='region', drop_first=False).astype(float)
    X_dt = pd.concat([region_dummies, df_dt[['cagr_observed', 'cagr_projected']]], axis=1)
    y_dt = df_dt['burden_tier']
    
    dt = DecisionTreeClassifier(criterion='gini', max_depth=3, min_samples_split=4, random_state=42)
    dt.fit(X_dt, y_dt)
    y_pred_dt = dt.predict(X_dt)
    
    acc_dt = accuracy_score(y_dt, y_pred_dt)
    macro_f1_dt = f1_score(y_dt, y_pred_dt, average='macro')
    cm_dt = confusion_matrix(y_dt, y_pred_dt, labels=["Tier_1_Low", "Tier_2_Moderate", "Tier_3_High", "Tier_4_Severe"])
    print(f"Decision Tree (Depth=3, random_state=42):")
    print(f"  Quartiles: Q1={q1}, Q2={q2}, Q3={q3}")
    print(f"  Sample size: {len(df_dt)}, Correct: {np.sum(y_dt == y_pred_dt)}/{len(df_dt)}")
    print(f"  Accuracy: {acc_dt:.4f} ({acc_dt*100:.2f}%)")
    print(f"  Macro F1: {macro_f1_dt:.4f}")
    print(f"  Confusion Matrix:\n{cm_dt}")
    print(f"  Tree rules:\n{export_text(dt, feature_names=list(X_dt.columns))}")
    
    # ----------------------------------------------------
    # C. NAIVE BAYES
    # ----------------------------------------------------
    print("\n--- 3. NAIVE BAYES AUDIT ---")
    df_nb = pd.read_sql_query("""
        SELECT s.site_id, s.site_name, s.is_tobacco_associated, s.organ_system_id,
               COALESCE(m.incident_cases, 0) AS male_cases,
               COALESCE(f.incident_cases, 0) AS female_cases,
               COALESCE(m.crude_rate, 0) AS male_crude_rate,
               COALESCE(f.crude_rate, 0) AS female_crude_rate
        FROM Dim_Cancer_Site s
        LEFT JOIN Fact_Cancer_Incidence m ON s.site_id = m.site_id AND m.gender = 'Male' AND m.time_id = 2022
        LEFT JOIN Fact_Cancer_Incidence f ON s.site_id = f.site_id AND f.gender = 'Female' AND f.time_id = 2022
        WHERE s.level_type != 'Total'
    """, con)
    
    df_nb['total_cases'] = df_nb['male_cases'] + df_nb['female_cases']
    df_nb['male_ratio'] = np.where(df_nb['total_cases'] > 0, df_nb['male_cases'] / df_nb['total_cases'], 0.5)
    
    X_nb = df_nb[['organ_system_id', 'male_ratio', 'male_crude_rate', 'female_crude_rate']].values
    y_nb = df_nb['is_tobacco_associated'].values
    
    nb = GaussianNB()
    nb.fit(X_nb, y_nb)
    y_pred_nb = nb.predict(X_nb)
    
    acc_nb = accuracy_score(y_nb, y_pred_nb)
    f1_nb = f1_score(y_nb, y_pred_nb)
    prec_nb = precision_score(y_nb, y_pred_nb)
    rec_nb = recall_score(y_nb, y_pred_nb)
    cm_nb = confusion_matrix(y_nb, y_pred_nb)
    
    print(f"Naive Bayes (N={len(df_nb)} sites):")
    print(f"  Non-Tobacco sites: {(y_nb == 0).sum()}, Tobacco sites: {(y_nb == 1).sum()}")
    print(f"  Accuracy: {acc_nb:.4f} ({acc_nb*100:.2f}%)")
    print(f"  Precision: {prec_nb:.4f}, Recall (Sensitivity): {rec_nb:.4f}, F1: {f1_nb:.4f}")
    print(f"  Confusion Matrix (TN={cm_nb[0,0]}, FP={cm_nb[0,1]}, FN={cm_nb[1,0]}, TP={cm_nb[1,1]}):\n{cm_nb}")
    print(f"  Check TP + FN = {cm_nb[1,0] + cm_nb[1,1]} (Must be 13)")
    print(f"  Check TN + FP = {cm_nb[0,0] + cm_nb[0,1]} (Must be 62)")
    print(f"  Total: {cm_nb.sum()} (Must be 75)")
    
    # ----------------------------------------------------
    # D. K-MEANS
    # ----------------------------------------------------
    print("\n--- 4. K-MEANS AUDIT ---")
    df_km = pd.read_sql_query("""
        SELECT geo_id, state_name, region_zone,
               cases_2022, cagr_observed, cagr_projected, national_share_2022
        FROM vw_olap_state_pivots
    """, con)
    
    features = ['cases_2022', 'cagr_observed', 'cagr_projected', 'national_share_2022']
    scaler = StandardScaler()
    X_scaled_km = scaler.fit_transform(df_km[features])
    
    km = KMeans(n_clusters=4, random_state=42, n_init=10)
    labels = km.fit_predict(X_scaled_km)
    df_km['cluster'] = labels
    
    sil = silhouette_score(X_scaled_km, labels)
    print(f"K-Means (k=4, random_state=42):")
    print(f"  Silhouette Score: {sil:.4f}")
    print(f"  Inertia: {km.inertia_:.2f}")
    
    # State counts per cluster
    for c_id in range(4):
        sub = df_km[df_km['cluster'] == c_id]
        print(f"  Cluster {c_id}: count={len(sub)}, mean_cases={sub['cases_2022'].mean():.1f}, mean_cagr_obs={sub['cagr_observed'].mean()*100:.2f}%, mean_cagr_proj={sub['cagr_projected'].mean()*100:.2f}%, states={sub['state_name'].tolist()}")
        
    # Check duplicate states
    all_clustered_states = df_km['state_name'].tolist()
    print(f"  Total states assigned: {len(all_clustered_states)} (Unique: {len(set(all_clustered_states))})")
    
    # ----------------------------------------------------
    # E. HIERARCHICAL CLUSTERING
    # ----------------------------------------------------
    print("\n--- 5. HIERARCHICAL CLUSTERING AUDIT ---")
    X_scaled_hc = scaler.fit_transform(df_km[['cases_2022', 'cagr_observed', 'cagr_projected']])
    Z = linkage(X_scaled_hc, method='ward')
    c_coeff, _ = cophenet(Z, pdist(X_scaled_hc))
    print(f"Hierarchical Ward Linkage:")
    print(f"  Z shape: {Z.shape} (Must be (36, 4))")
    print(f"  Cophenetic Correlation: {c_coeff:.4f}")
    print(f"  First 5 merges:\n{Z[:5]}")
    print(f"  Last 5 merges:\n{Z[-5:]}")
    
    # ----------------------------------------------------
    # F. APRIORI ASSOCIATION MINING
    # ----------------------------------------------------
    print("\n--- 6. APRIORI AUDIT ---")
    med_cases = df_km['cases_2022'].median()
    med_cagr_obs = df_km['cagr_observed'].median()
    med_cagr_proj = df_km['cagr_projected'].median()
    
    transactions = []
    for _, r in df_km.iterrows():
        basket = set()
        basket.add("Cases_High" if r['cases_2022'] >= med_cases else "Cases_Low")
        basket.add("ObservedCAGR_High" if r['cagr_observed'] >= med_cagr_obs else "ObservedCAGR_Low")
        basket.add("ProjectedCAGR_High" if r['cagr_projected'] >= med_cagr_proj else "ProjectedCAGR_Low")
        basket.add(f"Region_{r['region_zone'].replace(' ', '')}")
        if r['national_share_2022'] >= 0.05:
            basket.add("NationalShare_Top5pct")
        transactions.append(basket)
        
    N = len(transactions)
    print(f"Apriori transactions: {N} baskets")
    print(f"Median thresholds: cases={med_cases}, cagr_obs={med_cagr_obs:.4f}, cagr_proj={med_cagr_proj:.4f}")
    
    con.close()

if __name__ == "__main__":
    audit_all()
