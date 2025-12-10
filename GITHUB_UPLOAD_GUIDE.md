# GitHub 上传指南

## 前期准备

### 1. 安装 Git
- Windows: 下载并安装 [Git for Windows](https://git-scm.com/download/win)
- macOS: `brew install git`
- Linux: `sudo apt-get install git`

### 2. 创建 GitHub 账户
访问 [github.com](https://github.com) 注册账户（如果还没有）

### 3. 配置 Git
```bash
# 设置用户名
git config --global user.name "你的GitHub用户名"

# 设置邮箱
git config --global user.email "你的GitHub注册邮箱"
```

## 上传步骤

### 方法一：通过命令行上传

#### 1. 初始化本地仓库
```bash
# 进入项目目录
cd F:\TreaTest\1234

# 初始化 Git 仓库
git init
```

#### 2. 添加文件到暂存区
```bash
# 添加所有文件
git add .

# 或者只添加特定文件
git add README.md README_EN.md
```

#### 3. 提交更改
```bash
git commit -m "Initial commit: Field Notes and Interview Records System"
```

#### 4. 在 GitHub 创建新仓库
1. 登录 GitHub
2. 点击右上角的 "+" → "New repository"
3. 输入仓库名称（如：field-notes-system）
4. 选择公开（Public）或私有（Private）
5. 不要勾选 "Initialize this repository with a README"
6. 点击 "Create repository"

#### 5. 连接本地仓库与 GitHub
```bash
# 将 YOUR_USERNAME 和 YOUR_REPOSITORY 替换为你的信息
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
```

#### 6. 推送到 GitHub
```bash
# 推送到主分支
git push -u origin master

# 如果主分支是 main
git push -u origin main
```

### 方法二：使用 GitHub Desktop（图形界面）

#### 1. 下载并安装 [GitHub Desktop](https://desktop.github.com/)

#### 2. 添加本地仓库
1. 打开 GitHub Desktop
2. 点击 "Add existing repository"
3. 选择你的项目文件夹: F:\TreaTest\1234

#### 3. 提交更改
1. 在左侧填写提交信息
2. 点击 "Commit to master/main"

#### 4. 发布到 GitHub
1. 点击 "Publish repository"
2. 填写仓库名称和描述
3. 选择公开或私有
4. 点击 "Publish Repository"

### 方法三：直接通过网页上传

#### 1. 在 GitHub 创建新仓库

#### 2. 上传文件
1. 点击 "uploading an existing file"
2. 拖拽或选择你的文件
3. 填写提交信息
4. 点击 "Commit changes"

## 后续更新

### 添加新文件或修改后
```bash
# 查看状态
git status

# 添加更改
git add .

# 提交更改
git commit -m "描述你的更改"

# 推送到 GitHub
git push
```

## 最佳实践

### 1. 创建 .gitignore 文件
```bash
# 在项目根目录创建
echo "__pycache__/" > .gitignore
echo "*.pyc" >> .gitignore
echo "node_modules/" >> .gitignore
echo ".env" >> .gitignore
echo "*.log" >> .gitignore
```

### 2. 创建有意义的提交信息
- 使用清晰、简洁的描述
- 使用现在时态（"Add feature" 而不是 "Added feature"）
- 首字母大写

### 3. 分支管理
```bash
# 创建新分支
git branch feature/new-feature

# 切换到新分支
git checkout feature/new-feature

# 合并分支
git merge feature/new-feature
```

## 常见问题解决

### 1. 认证失败
- 使用 Personal Access Token 代替密码
- 设置：GitHub → Settings → Developer settings → Personal access tokens

### 2. 推送失败
```bash
# 先拉取最新更改
git pull origin master/main

# 再推送
git push origin master/main
```

### 3. 大文件上传
- 使用 Git LFS (Large File Storage)
```bash
# 安装 Git LFS
git lfs install

# 跟踪大文件
git lfs track "*.zip"
git lfs track "*.exe"
```

## 有用的命令

```bash
# 查看提交历史
git log --oneline

# 查看远程仓库
git remote -v

# 查看分支
git branch -a

# 回退到上一个版本
git reset --hard HEAD~1

# 查看差异
git diff
```

## 下一步建议

1. 完善 README 文件，添加项目截图和使用说明
2. 创建 LICENSE 文件（如果还没有）
3. 设置 Issues 模板和 Pull Request 模板
4. 考虑添加 CI/CD 工作流
5. 邀请协作者（如果是团队项目）

---

需要更详细的帮助？查看 [GitHub 官方文档](https://docs.github.com/) 或告诉我你遇到的具体问题！