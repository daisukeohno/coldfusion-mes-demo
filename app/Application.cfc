<!--- 生産管理システム (SEIZO-MES) / 1998年初版 --->
<!--- 2004/07 山田: 在庫画面追加 --->
<!--- 2011/03 佐藤: 検査ロット対応 (暫定) --->
<!--- 2016/11 ??? : 保全画面のSQL修正、要見直し --->
<cfcomponent output="false">

	<cfset this.name = "SEIZO_MES">
	<cfset this.sessionManagement = true>
	<cfset this.sessionTimeout = createTimeSpan(0,4,0,0)>
	<cfset this.applicationTimeout = createTimeSpan(1,0,0,0)>

	<!--- 本番/検証で同じ設定を使っている。切替は手動 (要注意) --->
	<cfset this.datasources["mesdb"] = {
		  class: "com.mysql.cj.jdbc.Driver"
		, connectionString: "jdbc:mysql://" & ( structKeyExists(server.system.environment,"MES_DB_HOST") ? server.system.environment.MES_DB_HOST : "db" ) & ":3306/mesdb?useUnicode=true&characterEncoding=UTF-8&serverTimezone=Asia/Tokyo&allowPublicKeyRetrieval=true&useSSL=false"
		, username: "mesuser"
		, password: "mespass"
	}>
	<cfset this.datasource = "mesdb">

	<cffunction name="onApplicationStart" returntype="boolean" output="false">
		<!--- 起動時に画面共通のマスタを読む。DBが落ちていると全画面が落ちる --->
		<cfset application.KOJO_NAME  = "第二工場 (SEIZO-MES)">
		<cfset application.LINE_LIST  = "L-01,L-02,L-03,L-04">
		<cfset application.HANTEI     = "OK,NG,再検査">
		<cfset application.MENU = [
			  { url:"index.cfm",       label:"ダッシュボード" }
			, { url:"orders.cfm",      label:"製造指示" }
			, { url:"progress.cfm",    label:"工程進捗入力" }
			, { url:"inspection.cfm",  label:"品質検査" }
			, { url:"maintenance.cfm", label:"設備保全" }
			, { url:"inventory.cfm",   label:"部品在庫" }
			, { url:"report.cfm",      label:"日報 (印刷用)" }
		]>
		<cfreturn true>
	</cffunction>

	<cffunction name="onRequestStart" returntype="boolean" output="false">
		<cfargument name="target" type="string">
		<!--- ログインは未実装。長年「社内ネットワークだから」で運用されている --->
		<cfif structKeyExists(url,"reinit")>
			<cfset applicationStop()>
			<cflocation url="index.cfm" addToken="false">
		</cfif>
		<cfreturn true>
	</cffunction>

	<cffunction name="onError" returntype="void" output="true">
		<cfargument name="exception" required="true">
		<cfargument name="eventName" type="string" required="false" default="">
		<cfoutput>
			<div style="font-family:'MS PGothic',sans-serif;border:2px solid ##990000;padding:8px;margin:8px;">
				<b>システムエラーが発生しました。管理者へ連絡してください。</b><br>
				<!--- エラー内容をそのまま画面に出している (レガシーの典型) --->
				<pre style="font-size:11px;">#encodeForHTML(arguments.exception.message)#</pre>
			</div>
		</cfoutput>
	</cffunction>

</cfcomponent>
