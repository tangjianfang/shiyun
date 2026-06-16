@echo off
REM ============================================================
REM  ShiYun Core MVP - Task Orchestration Script (ASCII only)
REM
REM  Usage:
REM    orchestrate.bat             Execute all tasks
REM    orchestrate.bat 5 6 7       Execute specified tasks
REM    orchestrate.bat --reset     Clear all completion flags
REM    orchestrate.bat --status    View current progress
REM
REM  Prereqs:
REM    - Node.js installed
REM    - Claude Code CLI installed (`claude` available)
REM    - Git initialized
REM ============================================================

setlocal enabledelayedexpansion

REM Path setup
set "ROOT=%~dp0"
set "TASKS_DIR=%ROOT%docs\superpowers\plans\tasks"
set "PROMPTS_DIR=%ROOT%\.tasks\prompts"
set "DONE_DIR=%ROOT%\.tasks\done"
set "LOGS_DIR=%ROOT%\.tasks\logs"

REM ============================================================
REM  Parameter handling
REM ============================================================

if "%1"=="--reset" goto :do_reset
if "%1"=="--status" goto :do_status

REM Create directories
if not exist "%PROMPTS_DIR%" mkdir "%PROMPTS_DIR%"
if not exist "%DONE_DIR%" mkdir "%DONE_DIR%"
if not exist "%LOGS_DIR%" mkdir "%LOGS_DIR%"

REM ============================================================
REM  Check Claude Code CLI
REM ============================================================
where claude >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] claude command not found. Install Claude Code CLI first.
    exit /b 1
)

REM ============================================================
REM  Generate all task prompts
REM ============================================================
echo [Setup] Generating task prompt templates...
call :gen_all_prompts
echo [Setup] Prompt templates generated
echo.

REM ============================================================
REM  Phase 1: Foundation (sequential)
REM ============================================================
echo.
echo ============================================================
echo  Phase 1: Foundation (project init, data, AI client)
echo ============================================================
call :run_task 01 "Project init and dependencies"
call :run_task 02 "Poem metadata (112 poems)"
call :run_task 03 "Data model and data.js"
call :run_task 04 "OpenAI client wrapper"

REM --- Phase 2: Foundation parallel ---
echo.
echo ============================================================
echo  Phase 2: Foundation parallel (storage + SRS)
echo ============================================================
call :run_parallel 11 "localStorage wrapper" 12 "SM-2 algorithm"

REM --- Phase 3: Generator (sequential) ---
echo.
echo ============================================================
echo  Phase 3: Generator (5 sequential tasks)
echo ============================================================
call :run_task 05 "Generator HTML skeleton"
call :run_task 06 "Generator - text generation"
call :run_task 07 "Generator - image generation"
call :run_task 08 "Generator - audio generation"
call :run_task 09 "Generator - export learning version"

REM --- Phase 4: Learning skeleton ---
echo.
echo ============================================================
echo  Phase 4: Learning version skeleton
echo ============================================================
call :run_task 10 "Learning version HTML skeleton + routing"

REM --- Phase 5: Detail + list pages (sequential) ---
echo.
echo ============================================================
echo  Phase 5: Poem detail page + list page
echo ============================================================
call :run_task 13 "Poem detail page"
call :run_task 14 "Poem list page"

REM --- Phase 6: 4 quiz modes (parallel) ---
echo.
echo ============================================================
echo  Phase 6: 4 quiz modes (parallel)
echo ============================================================
call :run_parallel 15 "Fill-in-the-blank quiz" 16 "Multiple choice quiz" 17 "Ordering quiz" 18 "Listen-and-choose quiz"

REM --- Phase 7: Review + progress + print + multi-user ---
echo.
echo ============================================================
echo  Phase 7: Review, progress, print, multi-user
echo ============================================================
call :run_task 19 "Review flow"
call :run_task 20 "Progress management"
call :run_task 21 "Print - 4 layouts"
call :run_task 22 "Multi-user switching"

REM --- Phase 8: Build, test, docs ---
echo.
echo ============================================================
echo  Phase 8: Build, test, docs
echo ============================================================
call :run_task 23 "Build script (Python)"
call :run_task 24 "End-to-end test checklist"
call :run_task 25 "README + documentation"

REM ============================================================
REM  Completion
REM ============================================================
echo.
echo ============================================================
echo   ALL TASKS COMPLETED!
echo ============================================================
echo.
echo Artifacts:
echo   - shi-yun-generator.html     %ROOT%
echo   - shi-yun-learning.html      %ROOT%dist\
echo.
echo Completion marker: %DONE_DIR%\ALL.done
echo done > "%DONE_DIR%\ALL.done"

echo.
echo Next steps:
echo   1. Double-click shi-yun-generator.html to configure API Key and generate content
echo   2. Give the generated shi-yun-learning.html to kids
echo.

exit /b 0

REM ============================================================
REM  Function definitions
REM ============================================================

:do_reset
echo [Reset] Clearing all completion flags...
if exist "%DONE_DIR%" del /q "%DONE_DIR%\*.done" 2>nul
if exist "%DONE_DIR%\ALL.done" del /q "%DONE_DIR%\ALL.done"
echo [Reset] Done. You can re-run orchestrate.bat
exit /b 0

:do_status
echo ============================================================
echo  Task completion status
echo ============================================================
if not exist "%DONE_DIR%" (
    echo No completion records (first run)
    exit /b 0
)
set /a TOTAL=0
set /a DONE=0
for /l %%i in (1,1,9) do (
    if exist "%DONE_DIR%\0%%i.done" (
        echo   [0%%i] DONE
        set /a DONE+=1
    ) else (
        echo   [0%%i] pending
    )
    set /a TOTAL+=1
)
for /l %%i in (10,1,25) do (
    if exist "%DONE_DIR%\%%i.done" (
        echo   [%%i] DONE
        set /a DONE+=1
    ) else (
        echo   [%%i] pending
    )
    set /a TOTAL+=1
)
echo.
echo Progress: !DONE! / !TOTAL!
if exist "%DONE_DIR%\ALL.done" echo Status: ALL COMPLETED
exit /b 0

:run_task
set N=%~1
set NAME=%~2
if "%N%"=="" goto :eof
if exist "%DONE_DIR%\%N%.done" (
    echo   [SKIP] Task %N% - %NAME% - already done
    goto :eof
)
echo.
echo [RUN] Task %N%: %NAME%
if not exist "%PROMPTS_DIR%\task-%N%.txt" (
    call :gen_prompt %N% %NAME%
)
REM Pipe prompt via stdin. Use --print for non-interactive mode.
type "%PROMPTS_DIR%\task-%N%.txt" | claude --print --dangerously-skip-permissions --add-dir "%ROOT%" > "%LOGS_DIR%\task-%N%.log" 2>&1
if !ERRORLEVEL! == 0 (
    echo done > "%DONE_DIR%\%N%.done"
    echo   [DONE] Task %N%
) else (
    echo   [FAIL] Task %N% - see %LOGS_DIR%\task-%N%.log
    echo   Continuing with remaining tasks...
)
goto :eof

:run_parallel
REM Usage: call :run_parallel 11 "name1" 12 "name2" ...
set "GROUP_TASKS="
:collect_args
if "%1"=="" goto :do_parallel
set GROUP_TASKS=!GROUP_TASKS! %1
shift
goto :collect_args
:do_parallel
echo   Parallel start: !GROUP_TASKS!
for %%T in (!GROUP_TASKS!) do (
    if exist "%DONE_DIR%\%%T.done" (
        echo   [SKIP] Task %%T - already done
    ) else (
        if not exist "%PROMPTS_DIR%\task-%%T.txt" (
            call :gen_prompt %%T "Task %%T"
        )
        start /b "" cmd /c "type ""%PROMPTS_DIR%\task-%%T.txt"" | claude --print --dangerously-skip-permissions --add-dir ""%ROOT%"" > ""%LOGS_DIR%\task-%%T.log"" 2>&1 && echo done > ""%DONE_DIR%\%%T.done"" || echo [FAIL] Task %%T"
    )
)
REM Wait for all parallel tasks to complete
:wait_parallel
set /a REMAINING=0
for %%T in (!GROUP_TASKS!) do (
    if not exist "%DONE_DIR%\%%T.done" set /a REMAINING+=1
)
if !REMAINING! GTR 0 (
    echo   Waiting for !REMAINING! parallel tasks...
    timeout /t 30 /nobreak >nul
    goto :wait_parallel
)
echo   Parallel tasks all completed
goto :eof

:gen_prompt
set N=%~1
set NAME=%~2
set PROMPT_FILE=%PROMPTS_DIR%\task-%N%.txt

REM Try to extract task content from task file
set TASK_FILE=
for /f "delims=" %%F in ('dir /b "%TASKS_DIR%\task-%N%-*.md" 2^>nul') do set "TASK_FILE=%TASKS_DIR%\%%F"

> "%PROMPT_FILE%" echo # Task %N%: %NAME%
>>"%PROMPT_FILE%" echo.
>>"%PROMPT_FILE%" echo You are executing task %N% of the ShiYun (Poetry Cloud) project.
>>"%PROMPT_FILE%" echo.
>>"%PROMPT_FILE%" echo ## IMPORTANT: One-shot completion mode
>>"%PROMPT_FILE%" echo.
>>"%PROMPT_FILE%" echo - This task MUST be completed in ONE SESSION. NO asking user, NO waiting for confirmation.
>>"%PROMPT_FILE%" echo - All code must be written complete, no TODO or "user input needed" placeholders.
>>"%PROMPT_FILE%" echo - On ambiguous requirements, make decisions based on best practices.
>>"%PROMPT_FILE%" echo - NO dialog boxes, NO AskUserQuestion, NO approval requests.
>>"%PROMPT_FILE%" echo - Tool failures: auto-retry 3 times; if still failing, log and continue.
>>"%PROMPT_FILE%" echo.
>>"%PROMPT_FILE%" echo ## Important context
>>"%PROMPT_FILE%" echo - Project root: C:\tjf\github\shi-yun
>>"%PROMPT_FILE%" echo - Full plan: docs/superpowers/plans/2026-06-16-shi-yun-core-mvp.md
>>"%PROMPT_FILE%" echo - Design doc: docs/superpowers/specs/2026-06-16-shi-yun-design.md
>>"%PROMPT_FILE%" echo - Task template: docs/superpowers/plans/TASK-TEMPLATE.md
>>"%PROMPT_FILE%" echo - Current working directory: %CD%
>>"%PROMPT_FILE%" echo.
>>"%PROMPT_FILE%" echo ## Task details
>>"%PROMPT_FILE%" echo.
if defined TASK_FILE (
    type "%TASK_FILE%" >> "%PROMPT_FILE%"
) else (
    >>"%PROMPT_FILE%" echo The detailed task definition is at: %TASK_FILE%
    >>"%PROMPT_FILE%" echo If that file does not exist, follow the task N definition in the plan document:
    >>"%PROMPT_FILE%" echo   docs/superpowers/plans/2026-06-16-shi-yun-core-mvp.md
    >>"%PROMPT_FILE%" echo Search for "### Task %N%" in that plan document.
)
>>"%PROMPT_FILE%" echo.
>>"%PROMPT_FILE%" echo ## Execution requirements (strict)
>>"%PROMPT_FILE%" echo.
>>"%PROMPT_FILE%" echo 1. Strict TDD: write test --^> verify fail --^> implement --^> verify pass --^> commit
>>"%PROMPT_FILE%" echo 2. All code must be complete and runnable; no TODO or pseudo code
>>"%PROMPT_FILE%" echo 3. After each task: `git add . ^&^& git commit -m "feat: Task %N% %NAME%"`
>>"%PROMPT_FILE%" echo 4. After completion, MUST run: `echo done ^> .tasks\done\%N%` (this is the task completion marker)
>>"%PROMPT_FILE%" echo 5. Error handling: network/compile errors retryable; one failed test should NOT stop the task
>>"%PROMPT_FILE%" echo 6. Dependency: if prereq artifacts are missing, create minimal placeholders so tests can run
>>"%PROMPT_FILE%" echo 7. Do NOT run `git push`, only `git add` + `git commit`
>>"%PROMPT_FILE%" echo.
>>"%PROMPT_FILE%" echo ## Completion output
>>"%PROMPT_FILE%" echo Brief summary (no more than 30 lines):
>>"%PROMPT_FILE%" echo - What you completed (functional points)
>>"%PROMPT_FILE%" echo - Files modified or created
>>"%PROMPT_FILE%" echo - Tests run (PASS/FAIL count)
>>"%PROMPT_FILE%" echo - Whether git committed and .tasks\done\%N% was created
goto :eof

:gen_all_prompts
REM Task list: id|name (ASCII names only)
set "TASK_LIST=01 ProjectInit 02 PoemMetadata 03 DataModel 04 OpenAIClient 05 GeneratorSkeleton 06 TextGen 07 ImageGen 08 AudioGen 09 ExportLearning 10 LearningSkeleton 11 Storage 12 SRS 13 PoemDetail 14 PoemList 15 QuizFill 16 QuizChoice 17 QuizOrder 18 QuizListen 19 Review 20 Progress 21 Print 22 MultiUser 23 Build 24 E2ETest 25 README"

for %%P in (%TASK_LIST%) do (
    set N=%%P
    if not exist "%PROMPTS_DIR%\task-!N!.txt" (
        call :gen_prompt !N! "Task %%P"
    )
)
goto :eof

endlocal
