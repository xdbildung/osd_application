# ÖSD 考试报名系统 - 本地测试服务器启动脚本
# 使用 Python 内置的 HTTP 服务器

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ÖSD 考试报名系统 - 本地测试服务器  " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 检测 Python 是否安装
$pythonCommand = $null

if (Get-Command python -ErrorAction SilentlyContinue) {
    $pythonCommand = "python"
    Write-Host "✓ 检测到 Python" -ForegroundColor Green
} elseif (Get-Command python3 -ErrorAction SilentlyContinue) {
    $pythonCommand = "python3"
    Write-Host "✓ 检测到 Python3" -ForegroundColor Green
} else {
    Write-Host "✗ 未检测到 Python，请先安装 Python" -ForegroundColor Red
    Write-Host ""
    Write-Host "下载地址: https://www.python.org/downloads/" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "或者使用其他方法启动服务器，请查看 TEST_GUIDE.md" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "按任意键退出..." -ForegroundColor Gray
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}

# 显示项目信息
Write-Host ""
Write-Host "项目目录: $PWD" -ForegroundColor Gray
Write-Host "服务器端口: 8000" -ForegroundColor Gray
Write-Host ""

# 显示访问地址
Write-Host "========================================" -ForegroundColor Green
Write-Host "  服务器启动成功！请访问以下地址：  " -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "主页面:" -ForegroundColor Yellow
Write-Host "  http://localhost:8000/index.html" -ForegroundColor Cyan
Write-Host ""
Write-Host "Public页面:" -ForegroundColor Yellow
Write-Host "  http://localhost:8000/public/index.html" -ForegroundColor Cyan
Write-Host ""
Write-Host "管理页面:" -ForegroundColor Yellow
Write-Host "  http://localhost:8000/admin.html" -ForegroundColor Cyan
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "测试提示:" -ForegroundColor Yellow
Write-Host "  1. 打开浏览器，访问上述任一地址" -ForegroundColor Gray
Write-Host "  2. 按 F12 打开开发者工具（查看控制台日志）" -ForegroundColor Gray
Write-Host "  3. 参考 TEST_GUIDE.md 进行功能测试" -ForegroundColor Gray
Write-Host ""
Write-Host "新增城市代码:" -ForegroundColor Yellow
Write-Host "  HZ-杭州 | NJ-南京 | WX-无锡" -ForegroundColor Cyan
Write-Host "  XA-西安 | QD-青岛 | ZZ-郑州" -ForegroundColor Cyan
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "按 Ctrl+C 停止服务器" -ForegroundColor Red
Write-Host ""

# 启动 Python HTTP 服务器
& $pythonCommand -m http.server 8000
