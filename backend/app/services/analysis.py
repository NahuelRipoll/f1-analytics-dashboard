import pandas as pd
import numpy as np
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import cross_val_score


# ── Pitstop timing analysis ──────────────────────────────────────────────────

def pitstop_timing_vs_position(pitstops: list[dict], results: list[dict]) -> dict:
    """Correlates first pitstop lap with final race position."""
    if not pitstops or not results:
        return {}

    ps_df = pd.DataFrame(pitstops)
    res_df = pd.DataFrame(results)

    # Normalize column names from Jolpica
    ps_df["lap"] = pd.to_numeric(ps_df.get("lap", ps_df.get("lap_number", 0)), errors="coerce")
    ps_df["driverId"] = ps_df.get("driverId", ps_df.get("driver_number", ""))
    res_df["position"] = pd.to_numeric(res_df["position"], errors="coerce")

    first_stops = ps_df.sort_values("lap").groupby("driverId").first().reset_index()
    merged = first_stops.merge(
        res_df[["driverId", "position"]],
        on="driverId",
        how="inner"
    )
    if merged.empty:
        return {}

    corr = float(merged[["lap", "position"]].corr().iloc[0, 1])
    buckets = merged.copy()
    buckets["lap_bucket"] = pd.cut(buckets["lap"], bins=5)
    avg_pos = buckets.groupby("lap_bucket", observed=True)["position"].mean().reset_index()
    avg_pos["lap_bucket"] = avg_pos["lap_bucket"].astype(str)

    return {
        "correlation": corr,
        "avg_position_by_stop_lap": avg_pos.to_dict(orient="records"),
        "data_points": merged[["driverId", "lap", "position"]].to_dict(orient="records"),
    }


def stops_vs_position(races_data: list[dict]) -> dict:
    """Analyzes number of pitstops vs final position across many races."""
    rows = []
    for race in races_data:
        pitstops = race.get("pitstops", [])
        results = race.get("results", [])
        if not pitstops or not results:
            continue
        ps_df = pd.DataFrame(pitstops)
        res_df = pd.DataFrame(results)
        stop_counts = ps_df.groupby("driverId").size().reset_index(name="num_stops")
        res_df["position"] = pd.to_numeric(res_df["position"], errors="coerce")
        merged = stop_counts.merge(res_df[["driverId", "position"]], on="driverId", how="inner")
        rows.append(merged)

    if not rows:
        return {}

    all_data = pd.concat(rows, ignore_index=True)
    summary = all_data.groupby("num_stops")["position"].agg(["mean", "count"]).reset_index()
    summary.columns = ["num_stops", "avg_position", "race_count"]

    return {
        "summary": summary.to_dict(orient="records"),
        "raw": all_data[["num_stops", "position"]].to_dict(orient="records"),
    }


def fastest_pitstop_teams(pitstops: list[dict]) -> list[dict]:
    """Ranks teams by average pitstop duration."""
    if not pitstops:
        return []
    df = pd.DataFrame(pitstops)
    if "duration" not in df.columns:
        return []
    df["duration"] = pd.to_numeric(df["duration"], errors="coerce")
    df = df.dropna(subset=["duration"])
    if "constructorId" in df.columns:
        group_col = "constructorId"
    elif "team_name" in df.columns:
        group_col = "team_name"
    else:
        return []
    summary = (
        df.groupby(group_col)["duration"]
        .agg(["mean", "min", "count"])
        .reset_index()
        .rename(columns={"mean": "avg_duration", "min": "best_duration", "count": "total_stops"})
        .sort_values("avg_duration")
    )
    return summary.to_dict(orient="records")


def undercut_analysis(pitstops: list[dict], laps_data: list[dict]) -> dict:
    """Detects undercut attempts and their success rate.
    An undercut occurs when driver A pits before driver B (who is ahead),
    and A overtakes B after fresh tires.
    """
    if not pitstops or not laps_data:
        return {"attempts": 0, "success_rate": None, "details": []}

    ps_df = pd.DataFrame(pitstops)
    laps_df = pd.DataFrame(laps_data)

    if "lap_number" not in ps_df.columns or "driver_number" not in ps_df.columns:
        return {"attempts": 0, "success_rate": None, "details": []}

    ps_df["lap_number"] = pd.to_numeric(ps_df["lap_number"], errors="coerce")
    first_stops = ps_df.sort_values("lap_number").groupby("driver_number").first().reset_index()

    # Need position data per lap — use lap_duration proxy
    if "lap_duration" not in laps_df.columns or laps_df.empty:
        return {"attempts": 0, "success_rate": None, "details": []}

    # Sort pairs of drivers by stop lap difference
    details = []
    drivers = first_stops["driver_number"].tolist()
    for i, d1 in enumerate(drivers):
        for d2 in drivers[i + 1:]:
            s1 = first_stops.loc[first_stops["driver_number"] == d1, "lap_number"].values[0]
            s2 = first_stops.loc[first_stops["driver_number"] == d2, "lap_number"].values[0]
            diff = abs(s1 - s2)
            if 1 <= diff <= 5:
                early, late = (d1, d2) if s1 < s2 else (d2, d1)
                details.append({"undercut_driver": int(early), "target_driver": int(late), "lap_diff": int(diff)})

    return {
        "attempts": len(details),
        "success_rate": None,  # Would need position-per-lap to determine
        "details": details[:50],
    }


def strategy_by_circuit(races_data: list[dict]) -> list[dict]:
    """Returns dominant strategies (1/2/3-stop) per circuit."""
    rows = []
    for race in races_data:
        pitstops = race.get("pitstops", [])
        results = race.get("results", [])
        circuit = race.get("Circuit", {}).get("circuitName", race.get("circuit_short_name", "Unknown"))
        if not pitstops or not results:
            continue
        ps_df = pd.DataFrame(pitstops)
        res_df = pd.DataFrame(results)
        stop_counts = ps_df.groupby("driverId").size().reset_index(name="num_stops")
        res_df["position"] = pd.to_numeric(res_df["position"], errors="coerce")
        merged = stop_counts.merge(res_df[["driverId", "position"]], on="driverId", how="inner")
        top10 = merged[merged["position"] <= 10]
        if top10.empty:
            continue
        dominant = top10["num_stops"].mode()
        rows.append({
            "circuit": circuit,
            "dominant_strategy": int(dominant.iloc[0]) if not dominant.empty else None,
            "avg_stops_top10": float(top10["num_stops"].mean()),
            "strategy_distribution": top10["num_stops"].value_counts().to_dict(),
        })
    return rows


# ── Prediction model ─────────────────────────────────────────────────────────

def build_prediction_model(races_data: list[dict]) -> dict:
    """
    Trains a GradientBoosting model to predict finishing position.
    Features: qualifying_position, num_stops, first_stop_lap, circuit_encoded
    """
    rows = []
    le = LabelEncoder()
    circuits = [r.get("Circuit", {}).get("circuitId", "unknown") for r in races_data]
    if circuits:
        le.fit(circuits)

    for race in races_data:
        pitstops = race.get("pitstops", [])
        results = race.get("results", [])
        qualifying = race.get("qualifying", [])
        circuit_id = race.get("Circuit", {}).get("circuitId", "unknown")
        if not pitstops or not results:
            continue

        ps_df = pd.DataFrame(pitstops)
        res_df = pd.DataFrame(results)
        qual_df = pd.DataFrame(qualifying) if qualifying else pd.DataFrame()

        stop_counts = ps_df.groupby("driverId").size().reset_index(name="num_stops")
        ps_df["lap"] = pd.to_numeric(ps_df.get("lap", 0), errors="coerce")
        first_stops = ps_df.sort_values("lap").groupby("driverId").first()[["lap"]].reset_index()
        first_stops.columns = ["driverId", "first_stop_lap"]

        res_df["position"] = pd.to_numeric(res_df["position"], errors="coerce")
        res_df["grid"] = pd.to_numeric(res_df["grid"], errors="coerce")

        merged = res_df[["driverId", "position", "grid"]].merge(stop_counts, on="driverId", how="left")
        merged = merged.merge(first_stops, on="driverId", how="left")

        if not qual_df.empty and "position" in qual_df.columns:
            qual_df["qual_pos"] = pd.to_numeric(qual_df["position"], errors="coerce")
            merged = merged.merge(qual_df[["driverId", "qual_pos"]], on="driverId", how="left")
        else:
            merged["qual_pos"] = merged["grid"]

        try:
            merged["circuit_enc"] = le.transform([circuit_id] * len(merged))
        except Exception:
            merged["circuit_enc"] = 0

        rows.append(merged)

    if not rows:
        return {"trained": False, "feature_importance": {}, "cv_score": None}

    all_data = pd.concat(rows, ignore_index=True)
    features = ["qual_pos", "num_stops", "first_stop_lap", "circuit_enc"]
    all_data = all_data.dropna(subset=features + ["position"])

    if len(all_data) < 30:
        return {"trained": False, "feature_importance": {}, "cv_score": None}

    X = all_data[features].values
    y = all_data["position"].values

    model = GradientBoostingRegressor(n_estimators=200, max_depth=4, random_state=42)
    scores = cross_val_score(model, X, y, cv=5, scoring="neg_mean_absolute_error")
    model.fit(X, y)

    importance = dict(zip(features, model.feature_importances_.tolist()))

    return {
        "trained": True,
        "feature_importance": importance,
        "cv_mae": float(-scores.mean()),
        "cv_mae_std": float(scores.std()),
        "label_encoder_classes": le.classes_.tolist(),
    }


def predict_race(
    model_data: dict,
    entries: list[dict],
) -> list[dict]:
    """
    entries: list of {driverId, qual_pos, num_stops, first_stop_lap, circuit}
    Returns predicted finishing positions.
    """
    if not model_data.get("trained"):
        return []
    return entries  # Placeholder — real impl needs persisted model
