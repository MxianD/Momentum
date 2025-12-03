import os
import pandas as pd
import matplotlib.pyplot as plt
from bson import decode_file_iter

BASE = os.path.dirname(__file__)
TEST_DIR = os.path.join(BASE, "test")
OUTPUT = os.path.join(BASE, "output")
os.makedirs(OUTPUT, exist_ok=True)

def load_bson(path):
    with open(path, "rb") as f:
        docs = list(decode_file_iter(f))
    return pd.DataFrame(docs)

def save_df(name, df):
    csv_path = os.path.join(OUTPUT, f"{name}.csv")
    df.to_csv(csv_path, index=False, encoding="utf-8-sig")
    print(f"✔ {name} 导出为 {csv_path}")

def plot_bar(series, title, xlabel, ylabel, filename, top_n=None):
    if series.empty:
        return
    if top_n is not None:
        series = series.head(top_n)
    plt.figure(figsize=(8, 4))
    series.plot(kind="bar")
    plt.title(title)
    plt.xlabel(xlabel)
    plt.ylabel(ylabel)
    plt.tight_layout()
    plt.savefig(os.path.join(OUTPUT, filename))
    plt.close()
    print(f"📊 生成图表: {filename}")

def plot_line(series, title, xlabel, ylabel, filename):
    if series.empty:
        return
    plt.figure(figsize=(8, 4))
    series.plot(kind="line")
    plt.title(title)
    plt.xlabel(xlabel)
    plt.ylabel(ylabel)
    plt.tight_layout()
    plt.savefig(os.path.join(OUTPUT, filename))
    plt.close()
    print(f"📈 生成图表: {filename}")

# ========= 读取所有集合 =========
dfs = {}
for name in ["users", "challenges", "forumposts", "userchallenges"]:
    path = os.path.join(TEST_DIR, f"{name}.bson")
    if not os.path.exists(path):
        print(f"⚠ 未找到 {path}，跳过")
        continue
    print(f"读取 {name} ...")
    df = load_bson(path)
    dfs[name] = df
    print(f"{name} 文档数: {len(df)}")
    print("字段：", list(df.columns))
    save_df(name, df)
    print()

# ========= 一些公用的小工具 =========
def parse_datetime_column(df, candidates=("createdAt", "created_at", "date", "created")):
    for col in candidates:
        if col in df.columns:
            try:
                s = pd.to_datetime(df[col])
                return col, s
            except Exception:
                continue
    return None, None

# ========= 1. Users 分析 =========
if "users" in dfs:
    users = dfs["users"]

    # 总用户数
    plt.figure(figsize=(4, 4))
    plt.bar(["Users"], [len(users)])
    plt.title("Total Users")
    plt.tight_layout()
    plt.savefig(os.path.join(OUTPUT, "users_total.png"))
    plt.close()
    print("📊 生成图表: users_total.png")

    # 用户注册趋势（按天）
    col, dt_series = parse_datetime_column(users)
    if dt_series is not None:
        users_by_day = dt_series.dt.date.value_counts().sort_index()
        plot_line(
            users_by_day,
            title="New Users per Day",
            xlabel="Date",
            ylabel="New Users",
            filename="users_new_per_day.png",
        )

    # 常见数值字段的分布（比如 streak、age 等）
    numeric_candidates = [c for c in users.columns if c not in ["_id", "__v"]]
    numeric_df = users[numeric_candidates].select_dtypes(include=["int64", "float64"])
    for col in numeric_df.columns:
        plt.figure(figsize=(6, 4))
        numeric_df[col].dropna().plot(kind="hist", bins=10)
        plt.title(f"Users - {col} 分布")
        plt.xlabel(col)
        plt.ylabel("count")
        plt.tight_layout()
        fname = f"users_{col}_hist.png"
        plt.savefig(os.path.join(OUTPUT, fname))
        plt.close()
        print(f"📊 生成图表: {fname}")

# ========= 2. Challenges 分析 =========
if "challenges" in dfs:
    challenges = dfs["challenges"]

    # 总挑战数
    plt.figure(figsize=(4, 4))
    plt.bar(["Challenges"], [len(challenges)])
    plt.title("Total Challenges")
    plt.tight_layout()
    plt.savefig(os.path.join(OUTPUT, "challenges_total.png"))
    plt.close()
    print("📊 生成图表: challenges_total.png")

    # 如果有 category / type 之类的字段
    for cat_col in ["category", "categories", "type"]:
        if cat_col in challenges.columns:
            counts = challenges[cat_col].astype(str).value_counts()
            plot_bar(
                counts,
                title=f"Challenges by {cat_col}",
                xlabel=cat_col,
                ylabel="Challenges",
                filename=f"challenges_by_{cat_col}.png",
                top_n=10,
            )
            break

    # 常见数值字段（例如 targetDays、duration 等）
    numeric_candidates = [c for c in challenges.columns if c not in ["_id", "__v"]]
    numeric_df = challenges[numeric_candidates].select_dtypes(include=["int64", "float64"])
    for col in numeric_df.columns:
        plt.figure(figsize=(6, 4))
        numeric_df[col].dropna().plot(kind="hist", bins=10)
        plt.title(f"Challenges - {col} 分布")
        plt.xlabel(col)
        plt.ylabel("count")
        plt.tight_layout()
        fname = f"challenges_{col}_hist.png"
        plt.savefig(os.path.join(OUTPUT, fname))
        plt.close()
        print(f"📊 生成图表: {fname}")

# ========= 3. UserChallenges 分析 =========
if "userchallenges" in dfs:
    uc = dfs["userchallenges"]

    # 每个用户参加的挑战数量 Top 10
    if "user" in uc.columns:
        user_counts = uc["user"].value_counts()
        plot_bar(
            user_counts,
            title="Top 10 Users by Joined Challenges",
            xlabel="User",
            ylabel="Joined Challenges",
            filename="userchallenges_users_top10.png",
            top_n=10,
        )

    # 每个 challenge 的参与人数 Top 10
    if "challenge" in uc.columns:
        ch_counts = uc["challenge"].value_counts()
        plot_bar(
            ch_counts,
            title="Top 10 Challenges by User Count",
            xlabel="Challenge",
            ylabel="Users",
            filename="userchallenges_challenges_top10.png",
            top_n=10,
        )

    # 如果有 status（例如 completed / in-progress）
    if "status" in uc.columns:
        status_counts = uc["status"].astype(str).value_counts()
        plot_bar(
            status_counts,
            title="Challenge Status Distribution",
            xlabel="Status",
            ylabel="Count",
            filename="userchallenges_status.png",
        )

# ========= 4. ForumPosts 分析 =========
if "forumposts" in dfs:
    posts = dfs["forumposts"]

    # 总发帖数
    plt.figure(figsize=(4, 4))
    plt.bar(["Posts"], [len(posts)])
    plt.title("Total Forum Posts")
    plt.tight_layout()
    plt.savefig(os.path.join(OUTPUT, "forumposts_total.png"))
    plt.close()
    print("📊 生成图表: forumposts_total.png")

    # 按用户发帖 Top 10
    if "user" in posts.columns:
        post_by_user = posts["user"].value_counts()
        plot_bar(
            post_by_user,
            title="Top 10 Users by Forum Posts",
            xlabel="User",
            ylabel="Posts",
            filename="forumposts_users_top10.png",
            top_n=10,
        )

    # 按日期发帖趋势
    col, dt_series = parse_datetime_column(posts)
    if dt_series is not None:
        posts_by_day = dt_series.dt.date.value_counts().sort_index()
        plot_line(
            posts_by_day,
            title="Forum Posts per Day",
            xlabel="Date",
            ylabel="Posts",
            filename="forumposts_per_day.png",
        )

print("\n🎉 分析完成！请查看 output 文件夹中的 CSV 和图表。")
