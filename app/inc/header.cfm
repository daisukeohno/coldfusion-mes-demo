<!--- 全画面共通ヘッダ。テーブルレイアウトのまま20年以上使われている --->
<cfoutput>
<html>
<head>
	<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
	<title>#application.KOJO_NAME# - 生産管理システム</title>
	<link rel="stylesheet" type="text/css" href="mes.css">
</head>
<body bgcolor="##d4d0c8">
<table width="100%" border="0" cellpadding="0" cellspacing="0" class="hdr">
	<tr>
		<td class="hdrTitle">生産管理システム&nbsp;SEIZO-MES&nbsp;Ver.3.2</td>
		<td align="right" class="hdrInfo">
			#application.KOJO_NAME#&nbsp;|&nbsp;#dateFormat(now(),"yyyy/mm/dd")# #timeFormat(now(),"HH:mm")#&nbsp;|&nbsp;担当者: 未ログイン&nbsp;
		</td>
	</tr>
</table>
<table width="100%" border="0" cellpadding="0" cellspacing="0" class="nav">
	<tr>
		<cfloop array="#application.MENU#" index="m">
			<cfset isCur = ( listLast(cgi.script_name,"/") EQ m.url )>
			<td class="navCell#isCur ? ' navCur' : ''#"><a href="#m.url#">#m.label#</a></td>
		</cfloop>
		<td width="100%">&nbsp;</td>
	</tr>
</table>
<div class="page">
</cfoutput>
