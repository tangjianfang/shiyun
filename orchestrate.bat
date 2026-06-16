@echo off
REM ============================================================
REM  诗云 核心 MVP - 任务编排脚本
REM
REM  用法：
REM    orchestrate.bat           执行所有任务
REM    orchestrate.bat 5 6 7     只执行指定任务
REM    orchestrate.bat --reset   清空所有完成标志，重新执行
REM    orchestrate.bat --status  查看当前进度
REM
REM  前置要求：
REM    - 已安装 Node.js (用于 Claude Code CLI)
REM    - 已安装 Claude Code CLI（`claude` 命令可用）
REM    - 已运行 `npm install` 安装项目依赖
REM    - 已运行 `git init` 初始化仓库
REM ============================================================

setlocal enabledelayedexpansion

REM 路径设置
set "ROOT=%~dp0"
set "PLAN=%ROOT%docs\superpowers\plans\2026-06-16-诗云-core-mvp.md"
set "TASKS_DIR=%ROOT%docs\superpowers\plans\tasks"
set "PROMPTS_DIR=%ROOT%.tasks\prompts"
set "DONE_DIR=%ROOT%.tasks\done"
set "LOGS_DIR=%ROOT%.tasks\logs"

REM 颜色支持（如果支持）
REM ANSI 颜色码：31=红 32=绿 33=黄 36=青

REM ============================================================
REM  参数处理
REM ============================================================

if "%1"=="--reset" goto :do_reset
if "%1"=="--status" goto :do_status

REM 创建必要目录
if not exist "%PROMPTS_DIR%" mkdir "%PROMPTS_DIR%"
if not exist "%DONE_DIR%" mkdir "%DONE_DIR%"
if not exist "%LOGS_DIR%" mkdir "%LOGS_DIR%"

REM ============================================================
REM  检查 Claude Code CLI
REM ============================================================
where claude >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] 未找到 claude 命令。请先安装 Claude Code CLI。
    echo         安装方法：npm install -g @anthropic-ai/claude-code
    exit /b 1
)

REM ============================================================
REM  生成所有任务的 prompt 文件
REM ============================================================
echo [Setup] 正在生成任务 prompt 模板...
call :gen_all_prompts
echo [Setup] Prompt 模板生成完成
echo.

REM ============================================================
REM  任务执行（按依赖顺序，部分并行）
REM ============================================================

REM --- Phase 1: 基础（顺序）---
echo.
echo ============================================================
echo  Phase 1: 基础（项目初始化、数据、AI 客户端）
echo ============================================================
call :run_task 01 "项目初始化与依赖"
call :run_task 02 "诗词元数据（112 首）"
call :run_task 03 "数据模型定义与 data.js"
call :run_task 04 "OpenAI 客户端封装"

REM --- Phase 2: 基础并行任务 ---
echo.
echo ============================================================
echo  Phase 2: 基础并行（存储 + 复习算法）
echo ============================================================
call :run_parallel 11 "localStorage 封装" 12 "SM-2 算法"

REM --- Phase 3: 生成器（顺序）---
echo.
echo ============================================================
echo  Phase 3: 生成器（5 个顺序任务）
echo ============================================================
call :run_task 05 "生成器 HTML 骨架"
call :run_task 06 "生成器-文本生成"
call :run_task 07 "生成器-配图生成"
call :run_task 08 "生成器-音频生成"
call :run_task 09 "生成器-导出学习版"

REM --- Phase 4: 学习版骨架 ---
echo.
echo ============================================================
echo  Phase 4: 学习版骨架
echo ============================================================
call :run_task 10 "学习版 HTML 骨架 + 路由"

REM --- Phase 5: 详情页 + 列表页（顺序）---
echo.
echo ============================================================
echo  Phase 5: 诗词详情页 + 列表页
echo ============================================================
call :run_task 13 "诗词详情页"
call :run_task 14 "诗词列表页"

REM --- Phase 6: 4 种考核模式（并行）---
echo.
echo ============================================================
echo  Phase 6: 4 种考核模式（并行）
echo ============================================================
call :run_parallel 15 "填空考核" 16 "选择考核" 17 "排序考核" 18 "听诗选诗"

REM --- Phase 7: 复习 + 进度 + 打印 + 多用户 ---
echo.
echo ============================================================
echo  Phase 7: 复习、进度、打印、多用户
echo ============================================================
call :run_task 19 "复习流程"
call :run_task 20 "进度管理"
call :run_task 21 "打印-4 种版式"
call :run_task 22 "多用户切换"

REM --- Phase 8: 构建、测试、文档 ---
echo.
echo ============================================================
echo  Phase 8: 构建、测试、文档
echo ============================================================
call :run_task 23 "构建脚本（Python）"
call :run_task 24 "端到端测试清单"
call :run_task 25 "README + 文档"

REM ============================================================
REM  完成
REM ============================================================
echo.
echo ============================================================
echo   全部完成！
echo ============================================================
echo.
echo 产物位置：
echo   - 诗云-生成器.html     %ROOT%
echo   - 诗云-学习版.html     %ROOT%dist\
echo.
echo 完成标志：%DONE_DIR%\ALL.done
echo done > "%DONE_DIR%\ALL.done"

echo.
echo 下一步：
echo   1. 双击 诗云-生成器.html 配置 API Key 并生成内容
echo   2. 把生成的 诗云-学习版.html 给孩子使用
echo.

exit /b 0

REM ============================================================
REM  函数定义
REM ============================================================

:do_reset
echo [Reset] 清空所有完成标志...
if exist "%DONE_DIR%" del /q "%DONE_DIR%\*.done" 2>nul
if exist "%DONE_DIR%\ALL.done" del /q "%DONE_DIR%\ALL.done"
echo [Reset] 完成。可以重新执行 orchestrate.bat
exit /b 0

:do_status
echo ============================================================
echo  任务完成状态
echo ============================================================
if not exist "%DONE_DIR%" (
    echo 无完成记录（首次运行）
    exit /b 0
)
set /a TOTAL=0
set /a DONE=0
for /l %%i in (1,1,9) do (
    if exist "%DONE_DIR%\0%%i.done" (
        echo   [0%%i] ✓
        set /a DONE+=1
    ) else (
        echo   [0%%i] ...
    )
    set /a TOTAL+=1
)
for /l %%i in (10,1,25) do (
    if exist "%DONE_DIR%\%%i.done" (
        echo   [%%i] ✓
        set /a DONE+=1
    ) else (
        echo   [%%i] ...
    )
    set /a TOTAL+=1
)
echo.
echo 进度：!DONE! / !TOTAL!
if exist "%DONE_DIR%\ALL.done" echo 状态：全部完成
exit /b 0

:run_task
set N=%~1
set NAME=%~2
if "%N%"=="" goto :eof
if exist "%DONE_DIR%\%N%.done" (
    echo   [SKIP] Task %N% - %NAME% （已完成）
    goto :eof
)
echo.
echo [RUN] Task %N%: %NAME%
if not exist "%PROMPTS_DIR%\task-%N%.txt" (
    call :gen_prompt %N% %NAME%
)
REM 使用 stdin 重定向传递 prompt（Claude Code CLI 不支持 @file 语法）
type "%PROMPTS_DIR%\task-%N%.txt" | claude --dangerously-skip-permissions > "%LOGS_DIR%\task-%N%.log" 2>&1
if !ERRORLEVEL! == 0 (
    echo done > "%DONE_DIR%\%N%.done"
    echo   [DONE] Task %N%
) else (
    echo   [FAIL] Task %N% - 详见 %LOGS_DIR%\task-%N%.log
    echo   继续执行剩余任务...
)
goto :eof

:run_parallel
REM 调用：call :run_parallel 11 "name1" 12 "name2" ...
set "GROUP_TASKS="
:collect_args
if "%1"=="" goto :do_parallel
set GROUP_TASKS=!GROUP_TASKS! %1
shift
goto :collect_args
:do_parallel
echo   并行启动: !GROUP_TASKS!
for %%T in (!GROUP_TASKS!) do (
    if exist "%DONE_DIR%\%%T.done" (
        echo   [SKIP] Task %%T （已完成）
    ) else (
        if not exist "%PROMPTS_DIR%\task-%%T.txt" (
            call :gen_prompt %%T "Task %%T"
        )
        start /b "" cmd /c "type ""%PROMPTS_DIR%\task-%%T.txt"" | claude --dangerously-skip-permissions > ""%LOGS_DIR%\task-%%T.log"" 2>&1 && echo done > ""%DONE_DIR%\%%T.done"" || echo [FAIL] Task %%T"
    )
)
REM 等待所有并行任务完成
:wait_parallel
set /a REMAINING=0
for %%T in (!GROUP_TASKS!) do (
    if not exist "%DONE_DIR%\%%T.done" set /a REMAINING+=1
)
if !REMAINING! GTR 0 (
    echo   等待 !REMAINING! 个并行任务完成...
    timeout /t 15 /nobreak >nul
    goto :wait_parallel
)
echo   并行任务全部完成
goto :eof

:gen_prompt
set N=%~1
set NAME=%~2
set PROMPT_FILE=%PROMPTS_DIR%\task-%N%.txt

REM 尝试从任务文件提取任务内容
set TASK_FILE=%TASKS_DIR%\task-%N%-*.md
for /f "delims=" %%F in ('dir /b %TASK_FILE% 2^>nul') do set "TASK_FILE=%TASKS_DIR%\%%F"

> "%PROMPT_FILE%" echo # 任务 %N%: %NAME%
>>"%PROMPT_FILE%" echo.
>>"%PROMPT_FILE%" echo 你正在执行"诗云"项目的第 %N% 个任务。
>>"%PROMPT_FILE%" echo.
>>"%PROMPT_FILE%" echo ## ⚠️ 重要：一次性完成模式
>>"%PROMPT_FILE%" echo.
>>"%PROMPT_FILE%" echo - 本任务必须在本会话内**一次性完成**，不允许询问用户、暂停等待确认
>>"%PROMPT_FILE%" echo - 所有代码必须直接编写完整，不要留 TODO 或"待用户输入"
>>"%PROMPT_FILE%" echo - 遇到模糊需求时，按最佳实践自行决策
>>"%PROMPT_FILE%" echo - 不要弹出对话框、不要调用 `AskUserQuestion`、不要请求审批
>>"%PROMPT_FILE%" echo - 工具调用失败时自动重试 3 次，仍然失败则记录并继续
>>"%PROMPT_FILE%" echo.
>>"%PROMPT_FILE%" echo ## 重要上下文
>>"%PROMPT_FILE%" echo - 项目根目录：C:\tjf\github\诗云
>>"%PROMPT_FILE%" echo - 完整计划：docs/superpowers/plans/2026-06-16-诗云-core-mvp.md
>>"%PROMPT_FILE%" echo - 设计文档：docs/superpowers/specs/2026-06-16-诗云-design.md
>>"%PROMPT_FILE%" echo - 任务模板：docs/superpowers/plans/TASK-TEMPLATE.md
>>"%PROMPT_FILE%" echo - 当前工作目录：%CD%
>>"%PROMPT_FILE%" echo.
>>"%PROMPT_FILE%" echo ## 任务详情
>>"%PROMPT_FILE%" echo.
if exist "%TASK_FILE%" (
    type "%TASK_FILE%" >> "%PROMPT_FILE%"
) else (
    >>"%PROMPT_FILE%" echo 详细任务定义在：%TASK_FILE%
    >>"%PROMPT_FILE%" echo 如果该文件不存在，请按计划文档中的对应任务编号执行。
)
>>"%PROMPT_FILE%" echo.
>>"%PROMPT_FILE%" echo ## 执行要求（严格执行）
>>"%PROMPT_FILE%" echo.
>>"%PROMPT_FILE%" echo 1. 严格按 TDD 流程：写测试 → 验证失败 → 写实现 → 验证通过 → 提交
>>"%PROMPT_FILE%" echo 2. 所有代码必须完整可运行，不能有 TODO/伪代码
>>"%PROMPT_FILE%" echo 3. 每个任务完成后用 `git add . ^&^& git commit -m "feat: Task %N% %NAME%"` 提交
>>"%PROMPT_FILE%" echo 4. 完成后**必须**执行：`echo done ^> .tasks\done\%N%` （这是任务完成标志）
>>"%PROMPT_FILE%" echo 5. 错误处理：网络/编译错误要可重试，单个测试失败不要终止
>>"%PROMPT_FILE%" echo 6. 依赖前置任务：如果前置任务的产物不存在，先创建最小占位（让测试可运行）
>>"%PROMPT_FILE%" echo 7. 不要执行 `git push`，只用 `git add` + `git commit`
>>"%PROMPT_FILE%" echo.
>>"%PROMPT_FILE%" echo ## 完成后输出
>>"%PROMPT_FILE%" echo 简要说明（不超过 30 行）：
>>"%PROMPT_FILE%" echo - 你完成了什么（功能点）
>>"%PROMPT_FILE%" echo - 修改/创建了哪些文件
>>"%PROMPT_FILE%" echo - 运行了哪些测试（PASS/FAIL 数）
>>"%PROMPT_FILE%" echo - 是否已 git commit + 创建 .tasks\done\%N%
goto :eof

:gen_all_prompts
REM 任务清单：id|name
set "TASK_LIST=01 项目初始化与依赖 02 诗词元数据 03 数据模型 04 OpenAI客户端 05 生成器骨架 06 文本生成 07 配图生成 08 音频生成 09 导出学习版 10 学习版骨架 11 localStorage 12 SM-2算法 13 诗词详情页 14 诗词列表页 15 填空考核 16 选择考核 17 排序考核 18 听诗选诗 19 复习流程 20 进度管理 21 打印版式 22 多用户切换 23 构建脚本 24 端到端测试 25 README"

for %%P in (%TASK_LIST%) do (
    set N=%%P
    if not exist "%PROMPTS_DIR%\task-!N!.txt" (
        REM 通过任务文件名查找名称（简化处理：固定名称）
        call :gen_prompt_simple !N!
    )
)
goto :eof

:gen_prompt_simple
set N=%1
set NAME=任务%N%
REM 名称映射（简化）
if "%N%"=="01" set NAME=项目初始化与依赖
if "%N%"=="02" set NAME=诗词元数据
if "%N%"=="03" set NAME=数据模型
if "%N%"=="04" set NAME=OpenAI客户端
if "%N%"=="05" set NAME=生成器骨架
if "%N%"=="06" set NAME=文本生成
if "%N%"=="07" set NAME=配图生成
if "%N%"=="08" set NAME=音频生成
if "%N%"=="09" set NAME=导出学习版
if "%N%"=="10" set NAME=学习版骨架
if "%N%"=="11" set NAME=localStorage
if "%N%"=="12" set NAME=SM-2算法
if "%N%"=="13" set NAME=诗词详情页
if "%N%"=="14" set NAME=诗词列表页
if "%N%"=="15" set NAME=填空考核
if "%N%"=="16" set NAME=选择考核
if "%N%"=="17" set NAME=排序考核
if "%N%"=="18" set NAME=听诗选诗
if "%N%"=="19" set NAME=复习流程
if "%N%"=="20" set NAME=进度管理
if "%N%"=="21" set NAME=打印版式
if "%N%"=="22" set NAME=多用户切换
if "%N%"=="23" set NAME=构建脚本
if "%N%"=="24" set NAME=端到端测试
if "%N%"=="25" set NAME=README
call :gen_prompt %N% "%NAME%"
goto :eof

endlocal
