' OwlLogics NexGen — Silent Launcher
' Opens index.html directly in default browser. No console, no server needed.
' Data is embedded — works with file:// protocol.

Set FSO = CreateObject("Scripting.FileSystemObject")
Set WshShell = CreateObject("WScript.Shell")
strDir = FSO.GetParentFolderName(WScript.ScriptFullName)
strFile = strDir & "\index.html"
WshShell.Run """" & strFile & """", 1, False
