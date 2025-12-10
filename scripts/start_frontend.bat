@echo off
echo 启动田野笔记系统前端应用...
echo.

cd /d "%~dp0..\frontend"

echo 检查Node.js环境...
node --version
if %errorlevel% neq 0 (
    echo 错误: 未找到Node.js环境，请先安装Node.js 16+
    pause
    exit /b 1
)

echo.
echo 检查依赖包...
if not exist "node_modules" (
    echo 安装依赖包...
    npm install
)

echo.
echo 启动前端开发服务器...
echo 应用地址: http://localhost:3000
echo.
npm start

pause
