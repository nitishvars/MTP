function refreshCaptcha(componentId,captchaPath)
{if(!captchaPath)captchaPath='index.php?option=com_rsform&task=captcha&componentId='+componentId;document.getElementById('captcha'+componentId).src=captchaPath+'&'+Math.random();document.getElementById('captchaTxt'+componentId).value='';document.getElementById('captchaTxt'+componentId).focus();}
function number_format(number,decimals,dec_point,thousands_sep)
{var n=number,prec=decimals;n=!isFinite(+n)?0:+n;prec=!isFinite(+prec)?0:Math.abs(prec);var sep=(typeof thousands_sep=="undefined")?',':thousands_sep;var dec=(typeof dec_point=="undefined")?'.':dec_point;var s=(prec>0)?n.toFixed(prec):Math.round(n).toFixed(prec);var abs=Math.abs(n).toFixed(prec);var _,i;if(abs>=1000){_=abs.split(/\D/);i=_[0].length%3||3;_[0]=s.slice(0,i+(n<0))+
_[0].slice(i).replace(/(\d{3})/g,sep+'$1');s=_.join(dec);}else{s=s.replace('.',dec);}
return s;}
function buildXmlHttp()
{var xmlHttp;try
{xmlHttp=new XMLHttpRequest();}
catch(e)
{try
{xmlHttp=new ActiveXObject("Msxml2.XMLHTTP");}
catch(e)
{try
{xmlHttp=new ActiveXObject("Microsoft.XMLHTTP");}
catch(e)
{alert("Your browser does not support AJAX!");return false;}}}
return xmlHttp;}
function ajaxValidation(form,page)
{try
{var el=form.elements.length;}
catch(err)
{form=this;}
var xmlHttp=buildXmlHttp();var url='';if(typeof rsfp_ajax_root!='undefined')
url=rsfp_ajax_root+'/';url+='index.php?option=com_rsform&task=ajaxValidate';if(page)
url+='&page='+page;var params=new Array();var submits=new Array();var success=false;var formId=0;for(i=0;i<form.elements.length;i++)
{if(!form.elements[i].name)continue;if(form.elements[i].name.length==0)continue;if(form.elements[i].type=='checkbox'&&form.elements[i].checked==false)continue;if(form.elements[i].type=='radio'&&form.elements[i].checked==false)continue;if(form.elements[i].type=='submit')
{submits.push(form.elements[i]);form.elements[i].disabled=true;}
if(form.elements[i].type=='select-multiple')
{for(var j=0;j<form.elements[i].options.length;j++)
if(form.elements[i].options[j].selected)
params.push(form.elements[i].name+'='+encodeURIComponent(form.elements[i].options[j].value));continue;}
if(form.elements[i].name=='form[formId]')
formId=form.elements[i].value;params.push(form.elements[i].name+'='+encodeURIComponent(form.elements[i].value));}
params=params.join('&');xmlHttp.open("POST",url,false);xmlHttp.setRequestHeader("Content-type","application/x-www-form-urlencoded");xmlHttp.setRequestHeader("Content-length",params.length);xmlHttp.setRequestHeader("Connection","close");xmlHttp.send(params);var success=true;if(xmlHttp.responseText.indexOf("\n")!=-1)
{var response=xmlHttp.responseText.split("\n");var ids=response[0].split(',');for(var i=0;i<ids.length;i++)
if(!isNaN(parseInt(ids[i]))&&document.getElementById('component'+ids[i]))
document.getElementById('component'+ids[i]).className='formNoError';var ids=response[1].split(',');for(var i=0;i<ids.length;i++)
if(!isNaN(parseInt(ids[i]))&&document.getElementById('component'+ids[i]))
{document.getElementById('component'+ids[i]).className='formError';success=false;}
if(response.length==4)
{page=parseInt(response[2])-1;totalPages=parseInt(response[3]);rsfp_changePage(formId,page,totalPages,false);}
for(var i=0;i<submits.length;i++)
submits[i].disabled=false;}
if(success==false&&document.getElementById('rsform_error_'+formId))
{try{document.getElementById('rsform_error_'+formId).style.display='block';}
catch(err){}}
return success;}
function rsfp_addEvent(obj,evType,fn){if(obj.addEventListener){obj.addEventListener(evType,fn,false);return true;}else if(obj.attachEvent){var r=obj.attachEvent("on"+evType,fn);return r;}else{return false;}}
function rsfp_getForm(formId)
{var formIds=document.getElementsByName('form[formId]');for(var i=0;i<formIds.length;i++)
{if(parseInt(formIds[i].value)!=parseInt(formId))
continue;var form=formIds[i].parentNode;if(form.tagName=='FORM'||form.nodeName=='FORM')
return form;while(form.parentNode)
{form=form.parentNode;if(form.tagName=='FORM'||form.nodeName=='FORM')
return form;}}}
function rsfp_verifyChecked(formId,name,value){isChecked=false;form=rsfp_getForm(formId);if(typeof form!='undefined')
{primary_loop:for(var i=0;i<form.elements.length;i++)
{var element=form.elements[i];var tagName=element.tagName||element.nodeName;switch(tagName)
{case'INPUT':if(element.type)
switch(element.type.toUpperCase())
{case'RADIO':if(!element.name||element.name!='form['+name+']')continue;if(element.checked==true&&element.value==value)
{isChecked=true;break primary_loop;}
break;case'CHECKBOX':if(!element.name||element.name!='form['+name+'][]')continue;if(element.checked==true&&element.value==value)
{isChecked=true;break primary_loop;}
break;}
break;case'SELECT':if(!element.name||element.name!='form['+name+'][]')continue;if(element.options)
for(var o=0;o<element.options.length;o++)
if(element.options[o].selected&&element.options[o].value==value)
{isChecked=true;break primary_loop;}
break;}}}
return isChecked;}
function rsfp_addCondition(formId,name,fnCondition){form=rsfp_getForm(formId);if(typeof form!='undefined'){for(var i=0;i<form.elements.length;i++){var element=form.elements[i];if(element.name&&(element.name=='form['+name+']'||element.name=='form['+name+'][]')){rsfp_addEvent(element,'click',function(){fnCondition();});rsfp_addEvent(element,'change',function(){fnCondition();});}}}}
function rsfp_getBlock(formId,block){form=rsfp_getForm(formId);if(typeof form!='undefined'){if(blocks=getElementsByClassName('rsform-block')){for(i=0;i<blocks.length;i++){var classes=blocks[i].className.split(' ');for(c=0;c<classes.length;c++){if(classes[c]=='rsform-block-'+block){if(blocks[i].parentNode){current_block=blocks[i];if(current_block==form)
return[blocks[i]];while(current_block.parentNode){current_block=current_block.parentNode;if(current_block==form)
return[blocks[i]];}}
return[blocks[i]];}}}}}}
function rsfp_getFieldsByName(formId,name){form=rsfp_getForm(formId);var results=new Array();if(typeof form!='undefined'){for(var i=0;i<form.elements.length;i++){var element=form.elements[i];pushed=false;if(element.name&&(element.name=='form['+name+']'||element.name=='form['+name+'][]')){results.push(element);pushed=true;}
if(pushed){if(element.id&&element.id.indexOf('txtcal')>-1){var suffix=element.id.replace('txtcal','');results.push(document.getElementById('btn'+suffix));}
var labels=form.getElementsByTagName('label');for(var l=0;l<labels.length;l++){if(labels[l].htmlFor&&labels[l].htmlFor==element.id)
results.push(labels[l]);}}}}
return results;}
function rsfp_setDisplay(items,value){for(i=0;i<items.length;i++)
items[i].style.display=value;}
var getElementsByClassName=function(className,tag,elm){if(document.getElementsByClassName){getElementsByClassName=function(className,tag,elm){elm=elm||document;var elements=elm.getElementsByClassName(className),nodeName=(tag)?new RegExp("\\b"+tag+"\\b","i"):null,returnElements=[],current;for(var i=0,il=elements.length;i<il;i+=1){current=elements[i];if(!nodeName||nodeName.test(current.nodeName)){returnElements.push(current);}}
return returnElements;};}
else if(document.evaluate){getElementsByClassName=function(className,tag,elm){tag=tag||"*";elm=elm||document;var classes=className.split(" "),classesToCheck="",xhtmlNamespace="http://www.w3.org/1999/xhtml",namespaceResolver=(document.documentElement.namespaceURI===xhtmlNamespace)?xhtmlNamespace:null,returnElements=[],elements,node;for(var j=0,jl=classes.length;j<jl;j+=1){classesToCheck+="[contains(concat(' ', @class, ' '), ' "+classes[j]+" ')]";}
try{elements=document.evaluate(".//"+tag+classesToCheck,elm,namespaceResolver,0,null);}
catch(e){elements=document.evaluate(".//"+tag+classesToCheck,elm,null,0,null);}
while((node=elements.iterateNext())){returnElements.push(node);}
return returnElements;};}
else{getElementsByClassName=function(className,tag,elm){tag=tag||"*";elm=elm||document;var classes=className.split(" "),classesToCheck=[],elements=(tag==="*"&&elm.all)?elm.all:elm.getElementsByTagName(tag),current,returnElements=[],match;for(var k=0,kl=classes.length;k<kl;k+=1){classesToCheck.push(new RegExp("(^|\\s)"+classes[k]+"(\\s|$)"));}
for(var l=0,ll=elements.length;l<ll;l+=1){current=elements[l];match=false;for(var m=0,ml=classesToCheck.length;m<ml;m+=1){match=classesToCheck[m].test(current.className);if(!match){break;}}
if(match){returnElements.push(current);}}
return returnElements;};}
return getElementsByClassName(className,tag,elm);};