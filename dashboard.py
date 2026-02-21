"""
Even B2B — Executive Financial Dashboard
Run: streamlit run dashboard.py
"""

import streamlit as st
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.ticker as mticker
from datetime import datetime, timedelta
import random

# ── Page config ──────────────────────────────────────────────
st.set_page_config(page_title="Even B2B – Financial Dashboard", layout="wide")

# ── Consistent styling ───────────────────────────────────────
PRIMARY = "#1F3A5F"
PRIMARY_LIGHT = "#E6EEF7"
SUCCESS = "#1E7F4F"
SUCCESS_LIGHT = "#B6E2CC"
WARNING = "#C47A00"
GRAY_LIGHT = "#E5E7EB"
GRAY_MID = "#9CA3AF"
TEXT = "#111827"
BG = "#FFFFFF"


# ── Data ─────────────────────────────────────────────────────
@st.cache_data
def load_project_data() -> pd.DataFrame:
    """Project-level budget snapshot (mirrors live Supabase data)."""
    return pd.DataFrame([
        {
            "project": "Downtown Office Fit-Out",
            "total_budget": 50_000,
            "committed_amount": 2_155,
            "actual_spent": 0,
        },
        {
            "project": "Maple Heights Reno",
            "total_budget": 75_000,
            "committed_amount": 5_074,
            "actual_spent": 1_954,
        },
        {
            "project": "Riverfront Tower",
            "total_budget": 125_000,
            "committed_amount": 11_606,
            "actual_spent": 3_928,
        },
    ])


@st.cache_data
def load_transaction_history() -> pd.DataFrame:
    """Simulated 60-day transaction history seeded from real totals."""
    random.seed(42)
    today = datetime.now().date()
    start = today - timedelta(days=59)

    rows = []
    # Approved transactions (spread across 60 days)
    approved_amounts = [
        320, 185, 450, 275, 890, 140, 560, 1200, 345, 210,
        780, 95, 430, 670, 155, 510, 1850, 290, 385, 720,
        165, 440, 830, 200, 615, 370, 1100, 255, 490, 680,
    ]
    for i, amt in enumerate(approved_amounts):
        rows.append({
            "date": start + timedelta(days=i * 2),
            "status": "approved",
            "amount": amt,
        })

    # Purchased transactions (subset, lagging behind approvals)
    purchased_amounts = [
        320, 185, 450, 275, 890, 140, 560, 1200, 345, 210,
        780, 95, 430, 670, 155, 510,
    ]
    for i, amt in enumerate(purchased_amounts):
        rows.append({
            "date": start + timedelta(days=i * 2 + 5),
            "status": "purchased",
            "amount": amt,
        })

    df = pd.DataFrame(rows)
    df["date"] = pd.to_datetime(df["date"])
    return df.sort_values("date").reset_index(drop=True)


# ── Chart: Budget vs Committed vs Actual ─────────────────────
def render_budget_bar_chart(df: pd.DataFrame):
    """Stacked horizontal bar — Actual / Committed / Remaining per project."""
    fig, ax = plt.subplots(figsize=(10, 3.2))
    fig.patch.set_facecolor(BG)
    ax.set_facecolor(BG)

    projects = df["project"].tolist()
    budgets = df["total_budget"].tolist()
    committed = df["committed_amount"].tolist()
    actual = df["actual_spent"].tolist()

    y_pos = range(len(projects))

    # Compute segments
    committed_only = [c - a for c, a in zip(committed, actual)]
    remaining = [b - c for b, c in zip(budgets, committed)]

    # Draw bars
    bars_actual = ax.barh(y_pos, actual, height=0.55, color=PRIMARY, label="Actual Spent", zorder=3)
    bars_committed = ax.barh(y_pos, committed_only, height=0.55, left=actual, color=SUCCESS_LIGHT, label="Committed (not yet spent)", zorder=3)
    bars_remaining = ax.barh(y_pos, remaining, height=0.55, left=committed, color=GRAY_LIGHT, label="Remaining Budget", zorder=3)

    # Labels on the right
    for i, (b, c, a) in enumerate(zip(budgets, committed, actual)):
        ax.text(b + b * 0.015, i, f"${b:,.0f}", va="center", fontsize=9, color=GRAY_MID, fontweight="500")

    ax.set_yticks(list(y_pos))
    ax.set_yticklabels(projects, fontsize=10, color=TEXT, fontweight="500")
    ax.invert_yaxis()

    ax.xaxis.set_major_formatter(mticker.FuncFormatter(lambda x, _: f"${x:,.0f}"))
    ax.tick_params(axis="x", labelsize=8, colors=GRAY_MID)

    for spine in ax.spines.values():
        spine.set_visible(False)
    ax.tick_params(left=False, bottom=False)
    ax.grid(axis="x", color="#F0F1F3", linewidth=0.6, zorder=0)

    ax.legend(
        loc="lower right",
        fontsize=8,
        frameon=False,
        ncol=3,
        labelcolor=GRAY_MID,
    )

    plt.tight_layout()
    st.pyplot(fig)
    plt.close(fig)


# ── Chart: Spend Over Time ────────────────────────────────────
def render_spend_trend(df: pd.DataFrame):
    """Cumulative approved vs purchased over the last 60 days."""
    fig, ax = plt.subplots(figsize=(10, 3.5))
    fig.patch.set_facecolor(BG)
    ax.set_facecolor(BG)

    approved = df[df["status"] == "approved"].copy()
    purchased = df[df["status"] == "purchased"].copy()

    approved = approved.groupby("date")["amount"].sum().cumsum().reset_index()
    purchased = purchased.groupby("date")["amount"].sum().cumsum().reset_index()

    ax.plot(approved["date"], approved["amount"], color=PRIMARY, linewidth=2, label="Approved (cumulative)", zorder=3)
    ax.fill_between(approved["date"], approved["amount"], alpha=0.08, color=PRIMARY, zorder=2)

    ax.plot(purchased["date"], purchased["amount"], color=SUCCESS, linewidth=2, label="Purchased (cumulative)", zorder=3)
    ax.fill_between(purchased["date"], purchased["amount"], alpha=0.08, color=SUCCESS, zorder=2)

    ax.yaxis.set_major_formatter(mticker.FuncFormatter(lambda x, _: f"${x:,.0f}"))
    ax.tick_params(axis="both", labelsize=8, colors=GRAY_MID)

    for spine in ax.spines.values():
        spine.set_visible(False)
    ax.tick_params(left=False, bottom=False)
    ax.grid(axis="y", color="#F0F1F3", linewidth=0.6, zorder=0)

    ax.legend(
        loc="upper left",
        fontsize=8,
        frameon=False,
        labelcolor=GRAY_MID,
    )

    plt.tight_layout()
    st.pyplot(fig)
    plt.close(fig)


# ── Section: Financial Health Overview ────────────────────────
def render_financial_health_section():
    """Main section containing both financial charts."""
    st.markdown("---")
    st.markdown(
        "<h2 style='font-size:18px; font-weight:600; color:#111827; margin-bottom:4px;'>"
        "Financial Health Overview</h2>",
        unsafe_allow_html=True,
    )
    st.markdown(
        "<p style='font-size:12px; color:#6B7280; margin-bottom:24px;'>"
        "Budget utilization and spend trends across all active projects</p>",
        unsafe_allow_html=True,
    )

    project_df = load_project_data()
    tx_df = load_transaction_history()

    # Budget vs Committed vs Actual
    st.markdown(
        "<p style='font-size:13px; font-weight:600; color:#111827; margin-bottom:8px;'>"
        "Budget vs Committed vs Actual by Project</p>",
        unsafe_allow_html=True,
    )
    render_budget_bar_chart(project_df)

    st.markdown("<div style='height:24px'></div>", unsafe_allow_html=True)

    # Spend Over Time
    st.markdown(
        "<p style='font-size:13px; font-weight:600; color:#111827; margin-bottom:8px;'>"
        "Spend Trend \u2013 Last 60 Days</p>",
        unsafe_allow_html=True,
    )
    render_spend_trend(tx_df)


# ── Budget Overview (existing-style KPI cards) ────────────────
def render_budget_overview():
    """Top-level KPI cards matching the app's design language."""
    project_df = load_project_data()

    total_budget = project_df["total_budget"].sum()
    total_committed = project_df["committed_amount"].sum()
    total_actual = project_df["actual_spent"].sum()
    total_remaining = total_budget - total_committed

    col1, col2, col3, col4 = st.columns(4)

    card_style = (
        "background:#fff; border:1px solid #E5E7EB; border-radius:10px; "
        "padding:20px 24px; text-align:center;"
    )
    label_style = "font-size:11px; font-weight:600; color:#6B7280; text-transform:uppercase; letter-spacing:0.5px;"
    value_style = "font-size:22px; font-weight:700; color:#111827; margin-top:4px;"

    with col1:
        st.markdown(
            f"<div style='{card_style}'>"
            f"<div style='{label_style}'>Total Budget</div>"
            f"<div style='{value_style}'>${total_budget:,.0f}</div></div>",
            unsafe_allow_html=True,
        )
    with col2:
        st.markdown(
            f"<div style='{card_style}'>"
            f"<div style='{label_style}'>Committed</div>"
            f"<div style='{value_style}'>${total_committed:,.0f}</div></div>",
            unsafe_allow_html=True,
        )
    with col3:
        st.markdown(
            f"<div style='{card_style}'>"
            f"<div style='{label_style}'>Actual Spent</div>"
            f"<div style='{value_style}'>${total_actual:,.0f}</div></div>",
            unsafe_allow_html=True,
        )
    with col4:
        st.markdown(
            f"<div style='{card_style}'>"
            f"<div style='{label_style}'>Remaining</div>"
            f"<div style='{value_style} color:#1E7F4F;'>${total_remaining:,.0f}</div></div>",
            unsafe_allow_html=True,
        )


# ── Main ──────────────────────────────────────────────────────
def main():
    # Header
    st.markdown(
        "<div style='display:flex; align-items:center; gap:12px; margin-bottom:24px;'>"
        "<div style='width:36px; height:36px; border-radius:8px; background:#1F3A5F; "
        "display:flex; align-items:center; justify-content:center;'>"
        "<span style='color:white; font-weight:700; font-size:16px;'>E</span></div>"
        "<div>"
        "<h1 style='font-size:18px; font-weight:700; color:#111827; margin:0; padding:0;'>Even B2B</h1>"
        "<p style='font-size:11px; color:#6B7280; margin:0;'>Construction Financial Dashboard</p>"
        "</div></div>",
        unsafe_allow_html=True,
    )

    # Budget Overview KPIs
    st.markdown(
        "<h2 style='font-size:15px; font-weight:600; color:#111827; margin-bottom:12px;'>"
        "Budget Overview</h2>",
        unsafe_allow_html=True,
    )
    render_budget_overview()

    # Financial Health charts
    render_financial_health_section()


if __name__ == "__main__":
    main()
