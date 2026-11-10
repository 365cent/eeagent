@echo off
REM ===========================================================================
REM  deckpeek single-file build (PyInstaller onefile)
REM
REM    build_exe.cmd           release : GUI subsystem, no console window
REM    build_exe.cmd console   debug   : console build, shows print / errors
REM
REM  output : dist\deckpeek.exe  or  dist\deckpeek-console.exe
REM  setup  : pip install -r requirements-dev.txt
REM  check  : python verify.py   (source + exe, PowerPoint optional)
REM ===========================================================================
setlocal
cd /d "%~dp0"

REM --- pick an interpreter that really has the build deps --------------------
REM (.venv here > py launcher > whatever "python" is on PATH; each is probed)
set "PY="
if exist ".venv\Scripts\python.exe" (
  ".venv\Scripts\python.exe" -c "import pptx,PyInstaller" >nul 2>nul
  if not errorlevel 1 set "PY=.venv\Scripts\python.exe"
)
if not defined PY (
  py -3 -c "import pptx,PyInstaller" >nul 2>nul
  if not errorlevel 1 set "PY=py -3"
)
if not defined PY (
  python -c "import pptx,PyInstaller" >nul 2>nul
  if not errorlevel 1 set "PY=python"
)
if not defined PY (
  echo [x] No Python with python-pptx + PyInstaller found.
  echo     Install Python 3.9+ and run: pip install -r requirements-dev.txt
  echo     If several Pythons are installed, create a local venv:
  echo         python -m venv .venv ^&^& .venv\Scripts\pip install -r requirements-dev.txt
  exit /b 1
)

set "NAME=deckpeek"
set "WINFLAG=--noconsole"
if /i "%~1"=="console" (
  set "NAME=deckpeek-console"
  set "WINFLAG=--console"
)

echo.
echo   python : %PY%
echo   target : dist\%NAME%.exe
echo.

%PY% -m PyInstaller --noconfirm --clean --onefile %WINFLAG% ^
  --name %NAME% --icon deckpeek.ico ^
  --collect-all pptx ^
  --hidden-import win32com.client --hidden-import pythoncom ^
  --hidden-import pywintypes --hidden-import win32timezone ^
  deckpeek.py
if errorlevel 1 goto fail
if not exist "dist\%NAME%.exe" goto fail

echo.
echo   [ok] built: %CD%\dist\%NAME%.exe
%PY% -c "import hashlib,os;p=os.path.join('dist','%NAME%.exe');d=open(p,'rb').read();print('   size   : '+str(len(d))+' bytes ('+format(len(d)/1048576.0,'.1f')+' MB)');print('   sha256 : '+hashlib.sha256(d).hexdigest())"
echo.
echo   next: %PY% verify.py
exit /b 0

:fail
echo.
echo   [x] build failed, see the log above.
exit /b 1
