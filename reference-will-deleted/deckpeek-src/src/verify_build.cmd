@echo off
REM ===========================================================================
REM  one-shot delivery gate: source check -> build -> exe check
REM
REM    verify_build.cmd             release build (GUI, no console)
REM    verify_build.cmd console     debug build (console, shows print/errors)
REM
REM  Any failing step returns non-zero. A green "ALL CHECKS PASSED" plus exit
REM  code 0 is the only state in which dist\ may be released.
REM ===========================================================================
setlocal
cd /d "%~dp0"

REM --- same interpreter probe as build_exe.cmd (needs python-pptx) -----------
set "PY="
if exist ".venv\Scripts\python.exe" (
  ".venv\Scripts\python.exe" -c "import pptx" >nul 2>nul
  if not errorlevel 1 set "PY=.venv\Scripts\python.exe"
)
if not defined PY (
  py -3 -c "import pptx" >nul 2>nul
  if not errorlevel 1 set "PY=py -3"
)
if not defined PY (
  python -c "import pptx" >nul 2>nul
  if not errorlevel 1 set "PY=python"
)
if not defined PY (
  echo [x] No Python with python-pptx found.
  echo     Install Python 3.9+ and run: pip install -r requirements-dev.txt
  exit /b 1
)

echo.
echo [1/3] source self-check (no packaging, PowerPoint optional)
%PY% verify.py --source-only
if errorlevel 1 goto fail

echo.
echo [2/3] build
call build_exe.cmd %1
if errorlevel 1 goto fail

echo.
echo [3/3] exe self-check
%PY% verify.py
if errorlevel 1 goto fail

echo.
echo ===========================================================================
echo   ALL CHECKS PASSED -- dist\ is ready to release
echo ===========================================================================
exit /b 0

:fail
echo.
echo ===========================================================================
echo   CHECK FAILED -- do not release
echo ===========================================================================
exit /b 1
