<!--- 工程進捗入力。登録処理とHTMLが同じファイルに同居している --->
<cfinclude template="inc/header.cfm">

<cfparam name="url.shiji_no"  default="">
<cfparam name="form.shiji_no" default="">
<cfparam name="form.mode"     default="">
<cfset msg = "">

<cfif form.mode EQ "regist">
	<!--- 入力チェックは数値かどうかだけ。トランザクションもロックもない --->
	<cfif NOT isNumeric(form.yoryo_suryo) OR NOT isNumeric(form.furyo_suryo)>
		<cfset msg = "NG:良品数と不良数は数値で入力してください。">
	<cfelse>
		<cfquery datasource="mesdb">
			insert into t_kotei_jisseki (shiji_no, kotei_no, kotei_nm, setsubi_cd, sagyousha, kaishi_dt, shuryo_dt, yoryo_suryo, furyo_suryo)
			values (
				  <cfqueryparam value="#form.shiji_no#" cfsqltype="cf_sql_varchar">
				, <cfqueryparam value="#form.kotei_no#" cfsqltype="cf_sql_integer">
				, <cfqueryparam value="#form.kotei_nm#" cfsqltype="cf_sql_varchar">
				, <cfqueryparam value="#form.setsubi_cd#" cfsqltype="cf_sql_varchar">
				, <cfqueryparam value="#form.sagyousha#" cfsqltype="cf_sql_varchar">
				, now()
				, <cfif form.kanryo EQ "1">now()<cfelse>null</cfif>
				, <cfqueryparam value="#form.yoryo_suryo#" cfsqltype="cf_sql_integer">
				, <cfqueryparam value="#form.furyo_suryo#" cfsqltype="cf_sql_integer">
			)
		</cfquery>
		<!--- 指示ヘッダの完了数を都度加算している。二重登録すると数が合わなくなる --->
		<cfquery datasource="mesdb">
			update t_seizou_shiji
			   set kanryo_suryo = kanryo_suryo + <cfqueryparam value="#form.yoryo_suryo#" cfsqltype="cf_sql_integer">
			     , furyo_suryo  = furyo_suryo  + <cfqueryparam value="#form.furyo_suryo#" cfsqltype="cf_sql_integer">
			     , status = '作業中'
			 where shiji_no = <cfqueryparam value="#form.shiji_no#" cfsqltype="cf_sql_varchar">
		</cfquery>
		<cfset msg = "OK:実績を登録しました。">
		<cfset url.shiji_no = form.shiji_no>
	</cfif>
</cfif>

<cfquery name="qShijiList" datasource="mesdb">
	select s.shiji_no, s.hinmoku_cd, h.hinmoku_nm, s.line_cd, s.suryo, s.kanryo_suryo, s.status
	from t_seizou_shiji s, m_hinmoku h
	where s.hinmoku_cd = h.hinmoku_cd
	  and s.status <> '完了'
	order by s.noki_ymd
</cfquery>

<cfquery name="qSetsubi" datasource="mesdb">
	select setsubi_cd, setsubi_nm, line_cd from m_setsubi order by setsubi_cd
</cfquery>

<cfquery name="qJisseki" datasource="mesdb">
	select j.*, m.setsubi_nm
	from t_kotei_jisseki j left join m_setsubi m on j.setsubi_cd = m.setsubi_cd
	order by j.jisseki_id desc
	limit 15
</cfquery>

<cfoutput>
<h1>工程進捗 入力</h1>

<cfif len(msg)>
	<div class="box" style="border-color:<cfif left(msg,2) EQ 'OK'>##006600<cfelse>##cc0000</cfif>;">
		<b<cfif left(msg,2) NEQ "OK"> class="ng"</cfif>>#listRest(msg,":")#</b>
	</div>
</cfif>

<div class="box">
<form method="post" action="progress.cfm">
	<input type="hidden" name="mode" value="regist">
	<table border="0" cellpadding="4" cellspacing="0">
		<tr>
			<td width="90">製造指示 <span class="ng">*</span></td>
			<td>
				<select name="shiji_no">
					<cfloop query="qShijiList">
						<option value="#qShijiList.shiji_no#"<cfif url.shiji_no EQ qShijiList.shiji_no> selected</cfif>>#qShijiList.shiji_no# / #qShijiList.hinmoku_nm# (#qShijiList.line_cd#)</option>
					</cfloop>
				</select>
			</td>
			<td width="70">工程順</td>
			<td><input type="text" name="kotei_no" value="2" size="3"></td>
			<td width="70">工程名</td>
			<td>
				<select name="kotei_nm">
					<cfloop list="鋳造,機械加工,組立,塗装,検査" index="k">
						<option value="#k#">#k#</option>
					</cfloop>
				</select>
			</td>
		</tr>
		<tr>
			<td>設備</td>
			<td>
				<select name="setsubi_cd">
					<option value="">(なし)</option>
					<cfloop query="qSetsubi">
						<option value="#qSetsubi.setsubi_cd#">#qSetsubi.setsubi_cd# #qSetsubi.setsubi_nm# (#qSetsubi.line_cd#)</option>
					</cfloop>
				</select>
			</td>
			<td>作業者</td>
			<td><input type="text" name="sagyousha" value="田中 一郎" size="12"></td>
			<td>良品数 <span class="ng">*</span></td>
			<td><input type="text" name="yoryo_suryo" value="10" size="6"></td>
		</tr>
		<tr>
			<td>不良数 <span class="ng">*</span></td>
			<td><input type="text" name="furyo_suryo" value="0" size="6"></td>
			<td>工程完了</td>
			<td><select name="kanryo"><option value="0">未完了</option><option value="1">完了</option></select></td>
			<td colspan="2"><input type="submit" value="　登　録　" class="btn"></td>
		</tr>
	</table>
</form>
<div style="font-size:11px;color:##606060;padding-top:4px;">
	※ 登録すると製造指示の完了数に加算されます。取消機能はありません (誤登録時は情報システム部に連絡してください)。
</div>
</div>

<h2>■ 直近の実績 (15件)</h2>
<table class="grid" width="100%">
	<tr><th>実績ID</th><th>指示番号</th><th>工程</th><th>工程名</th><th>設備</th><th>作業者</th><th>開始</th><th>終了</th><th>良品数</th><th>不良数</th></tr>
	<cfloop query="qJisseki">
		<tr<cfif qJisseki.currentRow MOD 2 EQ 0> class="alt"</cfif>>
			<td class="num">#qJisseki.jisseki_id#</td>
			<td><a href="order_detail.cfm?shiji_no=#qJisseki.shiji_no#">#qJisseki.shiji_no#</a></td>
			<td class="num">#qJisseki.kotei_no#</td>
			<td>#qJisseki.kotei_nm#</td>
			<td>#qJisseki.setsubi_cd# #qJisseki.setsubi_nm#</td>
			<td>#qJisseki.sagyousha#</td>
			<td>#dateFormat(qJisseki.kaishi_dt,"mm/dd")# #timeFormat(qJisseki.kaishi_dt,"HH:mm")#</td>
			<td><cfif isDate(qJisseki.shuryo_dt)>#dateFormat(qJisseki.shuryo_dt,"mm/dd")# #timeFormat(qJisseki.shuryo_dt,"HH:mm")#<cfelse><span class="ng">作業中</span></cfif></td>
			<td class="num">#qJisseki.yoryo_suryo#</td>
			<td class="num">#qJisseki.furyo_suryo#</td>
		</tr>
	</cfloop>
</table>
</cfoutput>

<cfinclude template="inc/footer.cfm">
