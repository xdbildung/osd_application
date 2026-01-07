@echo off
chcp 65001 >nul
REM ÖSD 考试报名系统 - 本地测试服务器启动脚本（批处理版本）

echo ========================================
echo   ÖSD 考试报名系统 - 本地测试服务器
echo ========================================
echo.

REM 检测 Python
where python >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✓ 检测到 Python
    set PYTHON_CMD=python
    goto :start_server
)

where python3 >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✓ 检测到 Python3
    set PYTHON_CMD=python3
    goto :start_server
)

echo ✗ 未检测到 Python，请先安装 Python
echo.
echo 下载地址: https://www.python.org/downloads/
echo.
echo 或者使用其他方法启动服务器，请查看 TEST_GUIDE.md
echo.
pause
exit /b 1

:start_server
echo.
echo 项目目录: %CD%
echo 服务器端口: 8000
echo.
echo ========================================
echo   服务器启动成功！请访问以下地址：
echo ========================================
echo.
echo 主页面:
echo   http://localhost:8000/index.html
echo.
echo Public页面:
echo   http://localhost:8000/public/index.html
echo.
echo 管理页面:
echo   http://localhost:8000/admin.html
echo.
echo ========================================
echo.
echo 测试提示:
echo   1. 打开浏览器，访问上述任一地址
echo   2. 按 F12 打开开发者工具（查看控制台日志）
echo   3. 参考 TEST_GUIDE.md 进行功能测试
echo.
echo 新增城市代码:
echo   HZ-杭州 ^| NJ-南京 ^| WX-无锡
echo   XA-西安 ^| QD-青岛 ^| ZZ-郑州
echo.
echo ========================================
echo.
echo 按 Ctrl+C 停止服务器
echo.

REM 启动 Python HTTP 服务器
%PYTHON_CMD% -m http.server 8000
