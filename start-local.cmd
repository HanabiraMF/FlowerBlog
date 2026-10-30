@echo off
setlocal EnableExtensions
chcp 65001 >nul
cd /d "%~dp0"
title FlowerBlog 本地测试

echo ================================================
echo   FlowerBlog 本地开发启动器
echo ================================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [错误] 没有找到 Node.js。
  echo 请先安装 Node.js 20.19 或更高版本：https://nodejs.org/
  echo.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo [1/3] 首次运行，正在安装依赖...
  call npm install
  if errorlevel 1 goto :failed
) else (
  echo [1/3] 依赖已就绪。
)

if not exist ".tmp" mkdir ".tmp" >nul 2>nul
set "TEMP=%CD%\.tmp"
set "TMP=%CD%\.tmp"
set "TMPDIR=%CD%\.tmp"

if not exist ".wrangler\state\v3\d1" (
  echo [2/3] 首次运行，正在初始化本地数据库...
  call npm run db:migrate:local
  if errorlevel 1 goto :failed
) else (
  echo [2/3] 本地数据库已就绪。
)

echo [3/3] 正在启动开发服务器...
echo.
echo   页面地址: http://localhost:5173
echo   API 地址: http://127.0.0.1:8787
echo.
echo   首次打开后，第一个注册的账号会自动成为管理员。
echo   按 Ctrl+C 可以停止服务器。
echo.

if /I "%FLOWERBLOG_NO_BROWSER%"=="1" goto :skipbrowser
start "" /b powershell -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "%~dp0scripts\open-browser.ps1"
:skipbrowser

call npm run dev
set "EXIT_CODE=%ERRORLEVEL%"
echo.
if "%EXIT_CODE%"=="0" (
  echo FlowerBlog 已停止。
) else (
  echo 服务器已停止（退出代码: %EXIT_CODE%）。
)
echo.
pause
exit /b %EXIT_CODE%

:failed
echo.
echo 启动失败，请检查上面的错误信息。
echo 常见原因：Node.js 版本过低、网络无法访问 npm，或端口 5173/8787 已被占用。
echo.
pause
exit /b 1
