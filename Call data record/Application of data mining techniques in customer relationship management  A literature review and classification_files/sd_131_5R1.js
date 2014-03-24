var AuthorAccess = {
  init: function() {
    if(SDM.authoraccess) {
      var h = '<div class="successMsgBox">';
      h += '<div class="imgIcon">';
      h += '<img title="Success" alt="Success" src="' + SDM.ep.imgBase + '/successIcon.gif" />';
      h += '</div>';
      h += '<div class="authClaimSuccess" >You have successfully claimed authorship of this article on ScienceDirect.';
      h += '<span class="closeTool">';
      h += '<a id="closeMsg" onclick="AuthorAccess.closeAuthClaimSuccessMsg()"  tabindex="0" >';
      h += '<img alt="Close subject area Dialog" title="Close subject area Dialog" src="' + SDM.ep.imgBase + '/grey_close-btn.png"/>';
      h += '</a>';
      h += '</span></div></div>';
      $('.authClaim').html(h);
      $('.successMsgBox').css('display','block');
    }
  },
  closeAuthClaimSuccessMsg: function() {
    $('.successMsgBox').hide();
  }
};

var DynamicArtContent = {
  dynamicComponents: null,

  buildDynamicRequestData: function() {

    var dynamicReqObj = new Object();
    var requestObj = new Object();
    requestObj.pii = SDM.pm.pii;
    requestObj.eid = SDM.pm.eid;
    requestObj.cid = SDM.pm.cid;
    requestObj.mod_cid=SDM.pm.mod_cid;
    requestObj.pdfEid = SDM.pm.pdfEid;
    requestObj.coverDate = SDM.pm.coverDate;
    requestObj.itemWeight = SDM.pm.itemWeight;
    requestObj.indexType = SDM.pm.indexType;
    requestObj.isEntitled = SDM.entitled;
    requestObj.contentType = SDM.contentType;

    dynamicReqObj.pageMetaData = requestObj;

    if ($('#checkForExcerpt')[0]) {
      dynamicReqObj.checkForExcerpt = true;
    } else {
      dynamicReqObj.checkForExcerpt = false;
    }

    DynamicArtContent.requestData = JSON.stringify (dynamicReqObj);
    DynamicArtContent.retryNum = 0;
    DynamicArtContent.retrieve();

  },
  retrieve: function() {
    $.post(SDM.urlPrefix+"/dc/article/all", { data:DynamicArtContent.requestData }, function(res) {
      try {
        var dynContent = $.parseJSON(res);
        DynamicArtContent.dynamicComponents = dynContent.DynamicComponentsResp;
        DynamicArtContent.populateDynamicComponents();
      } catch (e) {
        if(DynamicArtContent.retryNum < SDM.pf.dc.retry) {
          DynamicArtContent.retryNum++;
          var delay = DynamicArtContent.retryNum*SDM.pf.dc.retryDelay*SDM.pf.dc.retryFactor;
          setTimeout(DynamicArtContent.retrieve, delay);
        }
        else {
          return;
        }
      }
    }); 
  },
  populateDynamicComponents: function(fragId) {
    if (DynamicArtContent.dynamicComponents == null || DynamicArtContent.dynamicComponents == undefined) { return; }

    var scope = '#centerInner';
    if(typeof fragId!='undefined') {
      scope = '#' + fragId;
    }
  
    if ($(scope + ' #excerptPlaceholder')[0] && DynamicArtContent.dynamicComponents.excerptUrl != undefined ) {
      DynamicArtContent.buildPdfExcerptHtml (scope);
    }

    if ($(scope + ' #ppvPlaceHolder')[0]) {
      DynamicArtContent.buildPPVLinks (scope);
    } 

    if ($(scope + ' #refersToAndreferredToBy')[0]) {
      DynamicArtContent.populateRefersToAndReferredToBy();
    } 

    if($(scope + ' .publicationCover')[0]) {
      DynamicArtContent.populateRefModFields();
    }

    if ($(scope + ' span.mathmlsrc')[0] && DynamicArtContent.dynamicComponents.mathjaxAvail != undefined) {
      if ($.browser.msie) {
        if (DynamicArtContent.dynamicComponents.mathjaxAvailIE != undefined) {
          DynamicArtContent.addMathJaxButtons(scope);
        }
      } else {
          DynamicArtContent.addMathJaxButtons(scope);
      }
    }

  },
  populateRefModFields:function() {
      if(DynamicArtContent.dynamicComponents.moduleAvail != undefined && DynamicArtContent.dynamicComponents.moduleAvail =="Y"){
         if (DynamicArtContent.dynamicComponents.publicationLogo != undefined && DynamicArtContent.dynamicComponents.publicationLogo != ''){
             $('.toprightlogo').attr('src', DynamicArtContent.dynamicComponents.publicationLogo);
         }
         if (DynamicArtContent.dynamicComponents.publisherLogo != undefined && DynamicArtContent.dynamicComponents.publisherLogo != ''){
             $('#pubLogo').attr('src', DynamicArtContent.dynamicComponents.publisherLogo);
         }
         $('#mrwModuleSrcTitle').text(SDM.pm.mod_srcTitle);
      }
  },
  addMathJaxButtons: function(scope) {
    $(scope +' div.formula span.mathContainer').after ('<div class="mathjax"><a href="javascript:void(0);" role="button" class="mathButton mathjax" title="Turn MathJax on" aria-hidden="true">Turn<span class="mathjax ">&nbsp;</span><span class="offscreen">MathJax </span>on</a></div>');

    // Display first button
    if(!$('div.formula .firstFormula')[0] && window.MathJax===undefined){
      $('div.formula a.mathButton').first().removeAttr('aria-hidden').removeClass('mathButton').addClass('firstFormula').parent()
                             .attr({'aria-label':'MathJAX Management','role':'region'}).wrap("<div class='btContainer' style='height:25px;'></div>");
    } 

    if(Fragment.isAvail() && mathRenderer.opt.renderOn) {
      $(mathRenderer.opt.button).html('Turn<span class="mathjax">&nbsp;</span><span class="offscreen">MathJax </span>off');
      $(mathRenderer.opt.button).attr('title', 'Turn MathJax off');
    }
  },
  buildPdfExcerptHtml: function(scope) {
    var excerptHTML = "<a name=\"PDFExcerpt\"></a><h2 id=\"pdfExcerpt\">PDF excerpt</h2><p>Note: This is a one-page preview only. You will need to have a browser plugin installed capable of showing PDF content in the order to view the PDF excerpt online. <a class=\"excerptLink\" href=\"";
    excerptHTML += DynamicArtContent.dynamicComponents.excerptUrl;
    excerptHTML += "\"> Click here to download </a> excerpt.";
    excerptHTML += "<div id=\"pdfPage\" class=\"pdfExcerpt\"><div class=\"loadWindow\"><span>LOADING...</span></div></div>";
    $(scope).find('#excerptPlaceholder').html (excerptHTML);
    $(scope).find('#excerptPlaceholder').show();

    $('.excerptLink').bind('click', function(e) { var nw = window.open($('.excerptLink').attr('href'), 'newPdfWin', 'height=' + $(window).height()*.9 +',width=' + $(window).width()*.9); e.preventDefault(); e.stopPropagation();});

    DynamicArtContent.displayPdfExcerpt (); 

  },
  displayPdfExcerpt: function() {
    if($.browser.msie&&$.browser.version==9){
      var iframeObj="<iframe width='600' height= '820' src='" + excerptURL + "#toolbar=1&navpanes=0&view=Fit' frameborder='0'/>";
      $('#pdfPage').html(iframeObj);
    } else {
      var success = new PDFObject ({ url: DynamicArtContent.dynamicComponents.excerptUrl, id: "myPDF", width: "600px", height: "820px",
                                     pdfOpenParams: { navpanes: 0, toolbar: 1, statusbar: 0,scrollbar: 1, view: "Fit", pagemode: "none"}
                                  }).embed('pdfPage');
    } 
  },
  buildPPVLinks: function(scope) {
    var ppvHtml = '';
    if ( DynamicArtContent.dynamicComponents.AnonLinkAvail != undefined ) {
      ppvHtml += '<a class="corpReq cLink" queryStr="?_fmt=full" href="'
      ppvHtml += SDM.urlPrefix + '/article/pii/' + SDM.pm.pii;
      ppvHtml += '">View full text</a>';
    }
    ppvHtml += '<div class="unentitledMSG">';
    if ( DynamicArtContent.dynamicComponents.PPVButton != undefined ) {
      ppvHtml += decodeURIComponent (DynamicArtContent.dynamicComponents.PPVButton);
    }
    if ( DynamicArtContent.dynamicComponents.PPVPromoUrl != undefined ) {
      ppvHtml += '<div class="divBlk"><div align="right" onclick="displayOffer(this);" class="offerBtn" data-offerSummary="';
      ppvHtml += DynamicArtContent.dynamicComponents.PPVPromoUrl;
      ppvHtml += '"><img src="/sd/Offer_button_03.png"/></div></div>';
    }
    if ( DynamicArtContent.dynamicComponents.PPVMsg != undefined ) {
      ppvHtml += '<div class="ppvmsg">' + decodeURIComponent (DynamicArtContent.dynamicComponents.PPVMsg) + '</div>';
    }
    if ( DynamicArtContent.dynamicComponents.CapesUrl != undefined ) {
      ppvHtml += '<br/>';
      ppvHtml += '<a class="signup" href="';
      ppvHtml += DynamicArtContent.dynamicComponents.CapesUrl;
      ppvHtml += '" target="_blank"><div class="artSignUp"><div></div><span>Sign up for read-only PDF</span></div></a>';
    }
    ppvHtml += '</div>'
    if ( DynamicArtContent.dynamicComponents.CorpReqAvail != undefined  && !SDM.ignoreForceAbst ) {
      ppvHtml += '<a class="corpReq cLink" queryStr="?_fmt=full" href="'
      ppvHtml += SDM.urlPrefix + '/article/pii/' + SDM.pm.pii;
      ppvHtml += '">View full text</a>';
    }
    $(scope + ' #ppvPlaceHolder').html (ppvHtml);
    $(scope + ' #ppvPlaceHolder').show();
  }, 
  populateRefersToAndReferredToBy: function() {

    var request = new Object();
    var reqObj = new Object();
    reqObj.eid = SDM.pm.eid;

    var refersToArray = [];
    $.each($('.refersTo'), function(){
      var refersTo = new Object();
      refersTo.pii = $(this).text();
      refersTo.role = $(this).attr("data-role");
      refersToArray.push(refersTo);
    });

    if ($(refersToArray).length) {
      reqObj.refersToDetails = refersToArray;
    } 
    
    request.RequestData = reqObj;
    var requestData = JSON.stringify (request);

    $.post(SDM.refLinkURL, { data:requestData }, function(res) {
      if(!res.length) return;
      var relLinks;
      try { relLinks = $.parseJSON(res); } catch (e) { return; }
      if (relLinks != null && relLinks.RefersTo != undefined) {
        $('#refersTo').html(decodeURIComponent(relLinks.RefersTo));
        $('#refersTo').show()
      }
      if (relLinks != null && relLinks.ReferredToBy != undefined) {
        $('#referredToBy').html(decodeURIComponent(relLinks.ReferredToBy));
        $('#referredToBy').show();
      }
      DynamicArtContent.relLinksAdded = true;
    });
  } 
}; 

function getCookie(cName) {  
  var beg = document.cookie.indexOf(cName + '=');
  if(beg!=-1) {
    beg = beg + cName.length + 1;
    var end = document.cookie.indexOf(';', beg);
    if(end==-1) {
      return document.cookie.slice(beg);
    }
    return document.cookie.slice(beg, end);
  }
  return '';
}

function loadSocialLoginOptions(socialContainer){
	 var socialLoginURL = SDM.urlPrefix + "/getSocialIds";
	 var providerName="";
	 try {
		 $.get(socialLoginURL, function(res) {
			if(res) {
				var obj = $.parseJSON(res);
				var pro = obj.SocialLoginProviders;
				$.each(pro, function(){
					if(providerName != "") {
						providerName += ",";
					}
					providerName += this.providerName;
				});
				 gigya.socialize.showLoginUI({ 
					showTermsLink:false // remove 'Terms' link
					,authCodeOnly:true
					,width:'258px'
					,height:'30px'
					,UIConfig:'<config><body><controls><snbuttons buttonsize="20"></controls></body></config>'
					,authFlow:'redirect'
					,containerID: socialContainer
					,hideGigyaLink:true // remove 'Gigya' link
					,enabledProviders:providerName
					,onLoad:function(obj){
						socialLogin.init(obj.containerID);
					}
				});
			}
		 });
	 }
	 catch(err) {
		return;
	 }
}

// alt+title text for gigya
var socialLogin = {
  init: function(containerID) {
    var targetElm=$('#'+containerID).find('[gigid]').parent();
	$(targetElm).each(function(){
		$(this).attr('title','Use your '+$(this).attr('title')+' account to Login to ScienceDirect');
	});
	
  }
}

var refResolveEnabled = true;
var Fragment = {
  maps: undefined,
  crossRefMap: undefined,
  fragmentMap: undefined,
  mapAuthors: [],
  mapReferences: [],
  mapFigures: [],
  mapTables: [],
  mapFootnotes: [],
  mapEcomponents: [],
  mapUnknowns: [],
  scrollFlag: undefined,
  prevST: 0,
  gentle: true,
  hashWaitDone: false,
  reqRecord: [],
  init: function() {
    if(!Fragment.isAvail()) {
      return;
    }
  
    Fragment.reqRecord['frag_0'] = 1;
    Fragment.reqRecord['frag_1'] = 1;

    var mapsCounter = 0;
    var mc = 0;
    var mrd = SDM.pm.frag.mapRetryDelay;
    if (typeof SDM.pm.frag.mapsStr == 'undefined') {
      var mapCheck = function() {
        clearInterval(mapIntrvl);
        if(Fragment.maps||mapsCounter>SDM.pm.frag.mapRetry) {
        }
        else {
          Fragment.get ('maps', undefined);
          mapsCounter++;
          mrd = mrd*SDM.pm.frag.mapRetryFactor;
          mapIntrvl = setInterval(mapCheck, mrd);
        }
      }
      var mapIntrvl = setInterval(mapCheck, mrd);
    } else {
        Fragment.setMaps(SDM.pm.frag.mapsStr);
    }

    if($('#frag_1').length) {
      $('#frag_1').show();
      $('#pStretcher').remove();
      Fragment.foldCheck();
    }

//    $('#pStretcher').remove();
    $('#centerPane').scroll(Fragment.scroll);
    this.scrollFlag=true;
  },
  addFrag: function(fI, fC, cfg) {
    var fID = Fragment.fL[fI].match(/frag_[0-9]+/);
    fID = fID[0];
    if(!$('#' + fID).length) {
      var fragIdNum = fID.substr(fID.indexOf('_')+1)*1;
      Fragment.getPrevFrag(fragIdNum).after(Fragment.fL[fI]);
      $('#' + fID).hide();
        
      if(Fragment.isMalformation()) {
        //Yes malformation but leave it be since we will have entire article anyway ... just report it
        $.get(SDM.urlPrefix + "/frag/" + SDM.pm.pii + "/" + SDM.pm.fat + "/" + "mfi/mfiall", function() {});
      }
      Fragment.processFrag($('#' + fID));
    }
    ++fI;
    if(fI<fC) {
      setTimeout(function() {Fragment.addFrag(fI, fC, cfg);}, 100);
    }
    else {
      if(typeof cfg!='undefined' && typeof cfg.successCb=="function") {
        cfg.successCb(cfg.successCbArg);
      }
      refResolveEnabled = true;
    }
  },
  bail: function(t, r, i) {
    if(r != undefined) {
      if(SDM.pm.fat != undefined) {
        $.get(SDM.urlPrefix + "/frag/" + SDM.pm.pii + "/" + SDM.pm.fat + "/" + "mfi/" + r, function() {});
      }
      else {
        $.get(SDM.urlPrefix + "/frag/" + SDM.pm.pii + "/" + "status" + "/" + "mfi/" + r, function() {});
      }
    }
    var tt = 0;
    if(t != undefined) {  tt = t; }
    var ii = '';
    if(i != undefined) { ii = '#' + i; }
    Fragment.bail = function(t,r,i) {return;}
    setTimeout(function() {window.location.href = window.location.href + "?np=y" + ii;},tt);
  },
  fixFrag1: function() { //Called from end of frag_1 from server
    $('#centerInner').prepend($('#frag_1'));
    $('#frag_1').show();
    Fragment.foldCheck();
  },
  foldCheck: function(fragStr) {
    DBG.out(0, 'foldCheck(' + fragStr + ')');
    if(typeof fragStr == 'undefined') fragStr='frag_1';
    if( ($(window).height()*SDM.pm.frag.foldFactor) > ($('#centerInner')[0].scrollHeight*1.0) ) {
      var idInt = fragStr.substr(fragStr.indexOf('_')+1)*1;
      Fragment.get('frag_' + (idInt+1), undefined, {successCb: Fragment.foldCheck,
                                                    successCbArg: 'frag_' + (idInt+1)});
    }
    else {
      Fragment.processHash();
    }
  },
  isFooterEnabled: function() {
    if(typeof SDM.pm.fat=='undefined' || (Fragment.fragmentMap && Fragment.reqRecord[_.last(Fragment.fragmentMap)]) ) {
      return true;
    }
    return false;
  },
  isMalformation: function() {
    return $('#centerInner').children().not('noscript, .page_fragment, #pStretcher, .page_fragment_ind').length>0;
  },
  get: function(fragID, z, opts) {
    if($('#'+fragID).length) {
      $('#'+fragID).show();
      return;
    }
    DBG.out(0, 'Fragment.get(' + fragID + ')');
    DBG.out(0, opts);
    if(!Fragment.isAvail()) {
      Fragment.bail(300, 'getna');
      return;
    }

    var cfg = {
      successCb: undefined,
      successCbArg: undefined,
      failureCb: undefined,
      failureCbArg: undefined
    }
    if(opts) {
      $.extend(true, cfg, opts);
    }
    
    if(fragID=='all') {
      if(Fragment.all != undefined) return;
    }
    else if(fragID=='maps') {
    }
    else {
      if(Fragment.fragmentMap && typeof _.indexOf(Fragment.fragmentMap, fragID)=='undefined') {
        DBG.out(1, 'Invalid fragment get request based on fragmentMap');
        return;
      }
      else if($('.page_fragment').last().attr('data-last')=='true' &&
              $('.page_fragment').last().attr('data-fid') <= fragID.split('_')[1]) {
        DBG.out(1, 'Invalid fragment get request based on data-last');
        return;      
      }
    
      if(typeof Fragment.reqRecord[fragID] == 'undefined') {
        Fragment.reqRecord[fragID] = 1;
      }
      else {
        if(Fragment.gentle && Fragment.reqRecord[fragID]<SDM.pm.frag.retry) {
          Fragment.reqRecord[fragID] = Fragment.reqRecord[fragID]+1;
        }
        else {
          return;
        }
      }
    }

    document.cookie = 'SWS=' + SDM.pm.sws + ';;path=/';
    
    if(z!=undefined) {
      SD_UTIL.sendUserKeyEvent('pagination', 'article', z, SDM.keOriginContentFamily);
    }

    $.ajax({ type:'GET',
            url:SDM.urlPrefix + "/frag/" + SDM.pm.pii + "/" + SDM.pm.fat + "/" + fragID,
            aFragID:fragID,
            aCfg:cfg,
            aZ:z,
            success: function(a,b,c) {
              Fragment.getSuccess(a, this.aFragID, this.aCfg, this.aZ);
            },
            error: function(a,b,c) {
              Fragment.getError(this.aFragID, this.aCfg, this.aZ); 
            }
          });

  },
  getError: function(fragID, cfg, z) {
      if(fragID == 'maps') {
        Fragment.reqRecord[fragID] = Fragment.reqRecord[fragID]+1;
      }
      else if(fragID=='all') {
        if(typeof cfg!='undefined' && typeof cfg.failureCb=="function") {
          cfg.failureCb(cfg.failureCbArg);
        }
        return;
      }
      else {
        if(Fragment.gentle && Fragment.reqRecord[fragID]<SDM.pm.frag.retry) {
          DBG.out(1, 'got error on ' + fragID + ' retrying');
          setTimeout(function() {Fragment.get(fragID, z, cfg);}, SDM.pm.frag.retryDelay);
        }
        else {
          DBG.out(1, 'got error on ' + fragID + ' redirecting');
        if(typeof cfg!='undefined' && typeof cfg.failureCb=="function") {
          cfg.failureCb(cfg.failureCbArg);
        }
        else {
          Fragment.bail(300, 'geterr');
        }
      }
    }
  },
  getFragById: function(id) {
    return $('#'+id).parents('.page_fragment');
  },
  getIntraRefFragId: function(id) {
    var entry = _.find(Fragment.crossRefMap, function(obj) {return obj.id==id});
    if(entry) {
      return entry.fid;
    }
    else {
      DBG.out(0, "Fragment.getIntraRefFragId::" + id + " not found in map");
      return null;
    }

  },
  getNextByType: function(crntId, cStr) {
    var t = 'u';
    if(cStr=='authorName') {
      return Fragment.mapAuthors[Fragment.getNextIndex(Fragment.mapAuthors, crntId)];
    }
    else if(cStr=='references') {
      return Fragment.mapReferences[Fragment.getNextIndex(Fragment.mapReferences, crntId)];
    }
    else if(cStr=='figure') {
      return Fragment.mapFigures[Fragment.getNextIndex(Fragment.mapFigures, crntId)];
    }
    else if(cStr=='table') {
      return Fragment.mapTables[Fragment.getNextIndex(Fragment.mapTables, crntId)];
    }
    else if(cStr=='ecomponent') {
      return Fragment.mapEcomponents[Fragment.getNextIndex(Fragment.mapEcomponents, crntId)];
    }
    else if(cStr=='tblFootnote'||cStr=='footnote') {
      return Fragment.mapFootnotes[Fragment.getNextIndex(Fragment.mapFootnotes, crntId)];
    }
    else {
      return Fragment.mapUnknowns[Fragment.getNextIndex(Fragment.mapUnknowns, crntId)];
    }
  },
  getNextIndex: function(a, id) {
    var i = _.indexOf(a, _.find(a, function(str) {return str==id;}));
    if(i<a.length-1) {
      return i+1;
    }
    else {
      return -1;
    }
  },
  getPrevFrag: function(fragIdInt) {
    var locInt = 1;
    $('#centerInner .page_fragment').each(function() {
        var idStr = $(this).attr('id');
        var idInt = idStr.substr(idStr.indexOf('_')+1)*1;
        if(idInt<=fragIdInt && locInt<=idInt) {
          locInt = idInt;
        }
    });
    return $('#' + 'frag_' + locInt);
  },
  getPrevIndex: function(a, id) {
    var i = _.indexOf(a, _.find(a, function(str) {return str==id;}));
    if(i==0) {
      return -1;
    }
    else {
      return i-1;
    }
  },
  getPrevByType: function(crntId, cStr) {
    var t = 'u';
    if(cStr=='authorName') {
      return Fragment.mapAuthors[Fragment.getPrevIndex(Fragment.mapAuthors, crntId)];
    }
    else if(cStr=='references') {
      return Fragment.mapReferences[Fragment.getPrevIndex(Fragment.mapReferences, crntId)];
    }
    else if(cStr=='figure') {
      return Fragment.mapFigures[Fragment.getPrevIndex(Fragment.mapFigures, crntId)];
    }
    else if(cStr=='table') {
      return Fragment.mapTables[Fragment.getPrevIndex(Fragment.mapTables, crntId)];
    }
    else if(cStr=='ecomponent') {
      return Fragment.mapEcomponents[Fragment.getPrevIndex(Fragment.mapEcomponents, crntId)];
    }
    else if(cStr=='tblFootnote'||cStr=='footnote') {
      return Fragment.mapFootnotes[Fragment.getPrevIndex(Fragment.mapFootnotes, crntId)];
    }
    else {
      return Fragment.mapUnknowns[Fragment.getPrevIndex(Fragment.mapUnknowns, crntId)];
    }
  },
  getSuccess: function(fragStr, fragID, cfg, z) {
    var cookieStr = getCookie('FAT');
    if(cookieStr.length) {
      DBG.out(0, cookieStr);
      SDM.pm.fatOld = SDM.pm.fat;
      SDM.pm.fat = cookieStr;
    }
    if (fragID == 'maps') {
      Fragment.setMaps(fragStr);
      return;
    }
    if(fragID=='all') {
      Fragment.all = fragStr;
      Fragment.processAllRsp(cfg);
      return;
    }

    //Just in case there was a double request
    if($('#' + fragID).length) {
      return;
    }
    //Find the fragment above the one we received
    var fragIdNum = fragID.substr(fragID.indexOf('_')+1)*1;

    //Insert the fragment into page
    Fragment.getPrevFrag(fragIdNum).after(fragStr);
    $('#frag_' + fragIdNum).show();
      
    if(Fragment.isMalformation()) {
      Fragment.bail(300, 'mfi');
    }

    // Remove stretcher if present 
    // Stretcher should be added only after last fragment.
    if ($('#pStretcher')[0]) {
      $('#pStretcher').remove();
    }
    Fragment.processFrag($('#frag_' + fragIdNum));
    
    if(typeof cfg!='undefined' && typeof cfg.successCb=="function") {
      cfg.successCb(cfg.successCbArg);
    }
  },
  isAllLoaded: function() {
    if(typeof Fragment.fragmentMap == 'undefined') return false;
    var rslt = true;
    _.each(Fragment.fragmentMap, function(id) {
      if(!$('#'+id).length) {
        rslt = false;
      }
    });
    return rslt;
  },
  isAvail: function() {
    return typeof SDM.pm.fat!="undefined";
  },
  processAllRsp: function(cfg) {
    Fragment.all.length > 30 ? sI=-30 : sI=Fragment.all.length*-1;
    var endStr = Fragment.all.slice(sI);
    if(endStr.match(/ERROR::/)) {
      DBG.out(0, "processAllRsp:: Unable to retrieve all");
      return;
    }
    Fragment.fL = Fragment.all.split('!!!FRAG!!!');
    Fragment.all = Fragment.all.replace(/!!!FRAG!!!/g, '');
    var fC = Fragment.fL.length-1;
    refResolveEnabled = false;
    Fragment.addFrag(0, fC, cfg);
  },
  processFrag: function($frag) {
    var fragID = $frag.attr('id');
    var fragIdNum = $frag.attr('data-id')*1;
    if ($frag.find('.permissions')[0] && SDM.permAndReprint != '') {
      $frag.find ('.permissions').html (SDM.permAndReprint);
    }

    DynamicArtContent.populateDynamicComponents(fragID);

    if($frag.attr('data-last')) {
      DBG.out(1, fragID + " is the last fragment");
      Fragment.reqRecord['frag_'+(fragIdNum+1)]=1;
      var vpHeight = $(window).height();
      var d = ArticlePage.verticalStretcher($('#centerInner')[0].scrollHeight, vpHeight); 
    }

    //add dynamics to the fragment
    ArticlePage.addDynamics(fragID);
    $frag.on("click", ".intra_ref,.authorVitaeLink,.figureLink,.authorName, .viewWS", {z:'centerPane'}, rightSidePane.findTargetElement);

    $frag.on('click', '.btnHolder', function(e){ArticlePage.toggleOptions(e,this);} );

    ArticlePage.lazyLoadFragInit(fragID);

    //page.showFullTableLink();
    $('#' + fragID + ' div.downloadCsv').bind("click", TableDownload.processRequest);
    $('#' + fragID + ' a.ppt').bind("click", FigureDownload.processRequest);
    EComponent.init(fragID);

    if(!SDM.crawlerAvail) { refResolve(); }
    if(typeof sgf != 'undefined' && typeof sgf.continueFrameworkActivities != 'undefined') {
      sgf.continueFrameworkActivities(fragID);
    }
  },
  processHash: function() {
    DBG.out(1, 'Fragment.processHash()');
    // Maps are available, check whether url has any has identifier 
    var hash = window.location.hash;
    if (hash != 'undefined' && hash !='') {
      if(!Fragment.fragmentMap) {
        if(Fragment.hashWaitDone == false) {
          Fragment.hashWaitDone = true;
          setTimeout(function() {Fragment.processHash();}, SDM.pm.frag.hashWait);
        }
        else {
          return;
        }
      }
      hash = hash.substr(1);
      if($('#'+hash)[0]) {
         //Uncollapse any affected tbox before moving/scrolling to the target.
        CollapsibleTextbox.openTboxForTarget(hash);
        $('#centerPane').moveTo (hash); 
      }
      else {
        var targetFrag = Fragment.getIntraRefFragId (hash);
        if(targetFrag) {
          Fragment.get (targetFrag,
                        undefined, 
                        {successCb: function(hid) {
                        Fragment.scrollFlag = false;
                        $('.page_fragment').show();  
                        CollapsibleTextbox.openTboxForTarget(hid);
                        $('#centerPane').moveTo(hid, 
                                                {cbFunc:function() {
                                                    Fragment.scrollFlag=true;
                                                 }
                                                });
                          },
                        successCbArg: hash}); 
        }
      }
    }
  },
  scroll: function() {
    if(Fragment.scrollFlag) {
      var isDown = $("#centerPane").scrollTop() > Fragment.prevST;

      Fragment.prevST = $("#centerPane").scrollTop();
    
      var h = $("#centerPane").height();
      var st = $("#centerPane").scrollTop();
      var sh = $('#centerPane')[0].scrollHeight;
      var needList = Fragment.processScroll(st, st+h, isDown);
    }
  },
  setMaps: function(str) {
    try {
      Fragment.maps = $.parseJSON(str);
    }
    catch(e) {
      return;
    }
    Fragment.crossRefMap = Fragment.maps.crossRefs;
    Fragment.fragmentMap = Fragment.maps.list;
    Fragment.setCrossRefMap();
    Fragment.gentle=false;
  },
  setCrossRefMap: function() {
    var idList = Fragment.crossRefMap;
    var idListLen = idList.length;
    for(var i=0; i<idListLen; i++) {
      if(idList[i].t=='a') {
        Fragment.mapAuthors.push(idList[i].id);
      }
      else if(idList[i].t=='r') {
        Fragment.mapReferences.push(idList[i].id);
      }
      else if(idList[i].t=='f') {
        Fragment.mapFigures.push(idList[i].id);
      }
      else if(idList[i].t=='t') {
        Fragment.mapTables.push(idList[i].id);
      }
      else if(idList[i].t=='e') {
        Fragment.mapEcomponents.push(idList[i].id);
      }
      else if(idList[i].t=='n') {
        Fragment.mapFootnotes.push(idList[i].id);
      }
      else {
        Fragment.mapUnknowns.push(idList[i].id);
      }
    }
    Fragment.mapAuthors = _.uniq(Fragment.mapAuthors);
//    Fragment.mapReferences = _.uniq(Fragment.mapReferences);
//    Fragment.mapFigures = _.uniq(Fragment.mapFigures);
//    Fragment.mapTables = _.uniq(Fragment.mapTables);
//    Fragment.mapEcomponents = _.uniq(Fragment.mapEcomponents);
//    Fragment.mapFootnotes = _.uniq(Fragment.mapFootnotes);
  },
  processScroll: function (visTop, visBot, isDown) {
    DBG.out(1, 'processScroll(' + visTop + ',' + visBot + ')');
    var fList = [];
    $('#centerInner .page_fragment').each(function() {
      $(this).show();
      var fragTop = Math.floor($(this).position().top);
      var fragBot = Math.ceil($(this).height())+fragTop;
      if( (fragBot >= visTop && fragBot <= visBot) ||
          (fragTop >= visTop && fragTop <= visBot) ||
          (fragTop <= visTop && fragBot >= visBot)
        ) {
        fList.push($(this).attr('data-fid')*1);
        DBG.out(1, $(this).attr('id') + '::' + fragTop + '::' + fragBot);
      }
    });
    fList = _.sortBy(fList, function(i) {return i;});

    if(isDown) {
      if($('#frag_' + fList[fList.length-1]).attr('data-last')) {}
      else {
        var nfs = 'frag_' + (fList[fList.length-1]+1);
        DBG.out(0, 'Going down... looking for ' + nfs);
        if(!$(nfs).length) {
          Fragment.get(nfs, 'centerPane');
        }
        else {
          $(nfs).show();
        }
      }
    }
    else {
      if(fList[0]!=1) {
        var nfs = 'frag_' + (fList[0]-1);
        DBG.out(0, 'Going up... looking for ' + nfs);
        if(!$(nfs).length) {
          Fragment.get(nfs, 'centerPane', {successCb: function() {
            var nfsH = $('#'+nfs).height();
            var nst = $('#centerPane').scrollTop() + nfsH + 10;
            $('#centerPane').scrollTop(nst);
          }});
        }
        else {
          $(nfs).show();
          var nfsH = $('#'+nfs).height();
          var nst = $('#centerPane').scrollTop() + nfsH + 10;
          $('#centerPane').scrollTop(nst);
        }
      }
    }
  }
};

var sE = '#centerInner dl.figure, #centerInner dl.table, #centerInner dl.ecomponent, #centerInner h2, #centerInner h3, #centerInner h4';
var uE = '#centerInner div.articleOutlineHidden h2, #centerInner div.articleOutlineHidden h3, #centerInner div.articleOutlineHidden h4';
function initializeArticlePage(){
  ArticlePage = function() {
    var autoHide=0;
    var page = {
      objLColumn: $('#leftPane'),
      objCColumn: $('#centerPane'),
      objToolbarExt: $('#sdQuickSearch'),
      objToolbar: $('#articleToolbar'),
      selectorE: sE,
      selectorUE: uE,
      selectorE_BK: sE,
      selectorUE_BK: uE,
      boomboxAd:{width:280},
      ready: false,
      opts: {
        empty: false,
        selector: '',
        focusEffect: false,
        focus: {
          cssFocusFirst: 'outlineFocusFirst',
          cssFocus: 'outlineFocus',
          cssFocusLast: 'outlineFocusLast',
          scrollSyncSel: '#centerPane',
          idConvert: function(s) {return 'ol_'+s;}
        }
      },
      addDynamics: function(fragId) {
        var scope = '#centerInner';
        if(typeof fragId!='undefined') {
          scope = '#' + fragId;
        }

        $(scope + ' dl.figure dd a.linkText').hide();
        
        //all done if this was a fragment
        if(typeof fragId!='undefined') {return;}
//REBASE        $(".btnHolder").bind('click',function(e){page.toggleOptions(e,this);} );

        AuthorAccess.init();

        $('li.collabWithAuthorsCollapse a.collabText').bind('click',function(e){page.hideShow(e,this);} );
        $('li.collabWithAuthorsExpand a.collabText').bind('click',function(e){page.hideShow(e,this);} );

        $('#centerInner').off('click','a.mathImg , span.formulatext')
			 .on('click','a.mathImg , span.formulatext',function(e){page.submitCitation(e,this);});

        $('body').css('overflow', 'hidden').css('min-width', '');
        $('#header-area, #page-area, #articleToolbar').addClass('js');
        $('#leftPane, #leftPaneInner, #rightPane, #leftCloseBar, #centerPane, #outline, #olGraphCbBox, #centerContent, #rightInner').addClass('js');
        $('#leftPane, #centerPane, #rightPane').css('top', $('#articleToolbar').height());
        $('#leftCloseBar').css('margin-top', $('#articleToolbar').height());
        $('#page-area').css( { top: $('#header-area').height() } );
        if(SDU.isIE78()) {
          $(window).resize(function() { page.delay(function(){ page.setPaneWidths()}, 500)});
        }
        else {
          $(window).resize(_.debounce(page.setPaneWidths, 500));
        }
        rightSidePane.initAccordion();
        page.setPaneWidths();
        $('#rightPane').bind('resize', function(){$('#rightInner').accordion('resize');});
      },
      delay:function(callback, ms){   
        var timer = 0;  
        clearTimeout (timer);     
        timer = setTimeout(callback, ms);
      },
      verticalStretcher: function (paneScrlHeight, vpHeight) {
        var delta = 0;
        if(!$('#pStretcher').length) {
          $('#centerInner').append('<div id="pStretcher"></div>');
          $('#pStretcher').css('height', 0);
        }
        var sHeight = $('#pStretcher').css('height').split('px')[0]*1.0;
        var origPaneScrlHeight = paneScrlHeight - sHeight;
        if(origPaneScrlHeight<vpHeight) {
          if(SDU.isIE78()) delta = vpHeight - origPaneScrlHeight +150;
          else delta = vpHeight - origPaneScrlHeight +50;
        }
        $('#pStretcher').css({height:delta});
        DBG.out(1, 'ArticlePage::sizeStretcher()::stretcherHeight(' + delta + ')');
        return delta;
      },
      toggleOptions:function(e,obj) {
        var menuBtn = $(obj).parents('dd.menuButtonLinks').find('ul.menuButton');
        if ($(menuBtn)[0]) {
          if($(menuBtn).is(":visible")){
            $(menuBtn).hide('blind');
            $(obj).parent().find("div").removeClass("up_Btn");
            $(document).off('click', 'body, .menuButton .viewWS', page.closeOptions);
          }else{
            page.closeOptions();
            $(menuBtn).show('blind');
            $(obj).parent().find('div').addClass("up_Btn");
            $(document).on('click', 'body, .menuButton .viewWS', page.closeOptions);
          }
        }
	$('#centerPane').bind('scroll',ArticlePage.closeOptions);
        SD_UTIL.killEvent(e); 
      },
      closeOptions:function(e) {
        $(document).off('click', 'body, .menuButton .viewWS', page.closeOptions);
        $('.menuButtonLinks ul.menuButton').each(function(){
            if($(this).is(":visible")){
              $(this).parent('.menuButtonLinks').find("div").removeClass("up_Btn");
              $(this).hide('blind');
            }
        }); 
      }, 
      hideShow:function(e,obj) {
        if($('.hideShow').css('display') !='block') {
           $('.hideShow').css('display','block');
        $(obj).css('background','url("/sd/minus.gif") no-repeat scroll 0 5px transparent');
        } else {
        $('.hideShow').css('display','none');
        $(obj).css('background','url("/sd/plus.gif") no-repeat scroll 0 5px transparent');
        }
      },
     submitCitation:function(e,obj) {
       var authorStr='';
       $(".authorGroup").each (function() {
         if($(this).hasClass('noCollab')){
              $(this).find(".authorName").each (function() {
                     if(!$(this).parents('.collab')[0]){
                       if (authorStr != '' && !$(this).hasClass('text')) { authorStr += ', '; }
         authorStr += $(this).text();
         var authDegree = $(this).next('span.authorDegrees');
         if(authDegree != null && $(authDegree).text() != '') {
              authorStr += ', ';
              authorStr += $(authDegree).text();
         }
                     }
              });
              var collab = $(this).find('.collab');
              if (collab != null && $(collab).text() != '') {
                authorStr += ', ';
                authorStr += $(collab).find(".collabText").text();
              };
              if ($(collab).find('.authorGroup')[0]) {
                var collabAuthors = $(collab).find('.authorGroup');
                var collabAuthorStr = '';
                authorStr += ' (';
                $(collabAuthors).find(".authorName").each (function() {
                       if (collabAuthorStr != '') { collabAuthorStr += ', '; }
                       collabAuthorStr += $(this).text();
                       var authDegree = $(this).next('span.authorDegrees');
                       if(authDegree != null && $(authDegree).text() != '') {
                            collabAuthorStr += ', ';
                            collabAuthorStr += $(authDegree).text();
                       }
                });
                authorStr += collabAuthorStr;
                authorStr += ')';
              };
         }
       });
       var artTitleObj = $(".svTitle").clone();
       artTitleObj.find('noscript').remove();
       var articleTitle = artTitleObj.text();
       var doiLink = 'http://dx.doi.org/' + SDM.doi;
       var pubTitle = $(".publicationHead div.title").text();
       if (pubTitle == "") {
         pubTitle = $(".publicationHead div.title").find("img").attr("alt");
       }
       var volIssueDetails = $(".publicationHead p.volIssue").text();
       var specIssueDetails = $(".publicationHead p.specIssueTitle").text();
       articleTitle += authorStr+' \r\n';
       articleTitle += 'Published in:\r\n'+pubTitle+' \r\n'+volIssueDetails+' \r\n'+doiLink;
       var actionUrl = $(obj).attr('data-mathURL'); 
       $("#citationInfo input[name='art_citation']").val(articleTitle);
       $("#citationInfo").attr('action',actionUrl);
       $("#citationInfo").submit(); 
     },
      setPaneWidths: function () {
        $('html,body').css({'overflow-x': 'hidden', 'overflow-y': 'hidden'});
        //Check if browser tall enough for header/footer dynamics
        var vpHeight = $(window).height();
        var d = page.verticalStretcher($('#centerInner')[0].scrollHeight, vpHeight);
        page.viewHandler();

        pgLayout.vpWidth = $(window).width();
        /*reset to default values*/
        pgLayout.lcWidth = 258;
        pgLayout.ccWidth = 700;
        pgLayout.rcWidth = 300;
        pgLayout.lcLeft = 3;
        pgLayout.ccLeft = 260;
        pgLayout.rcLeft = 960;
        if (1606 <= pgLayout.vpWidth) {
          pgLayout.pgLeft = Math.floor(pgLayout.vpWidth/2) - 803;
          pgLayout.pgWidth = 1606;
          pgLayout.rcWidth = 640;
          Outline.sidebarOpen();
          rightSidePane.openPane();
          pgLayout.showRightBar=true;
          pgLayout.showLeftBar=true;
        }
        else if (1266 <= pgLayout.vpWidth) {
          pgLayout.pgLeft = 0;
          pgLayout.pgWidth = pgLayout.vpWidth;
          pgLayout.rcWidth = pgLayout.vpWidth - 965;
          $('#leftOpenBar').hide();
          Outline.sidebarOpen();
          rightSidePane.openPane();
          pgLayout.showRightBar=true;
          pgLayout.showLeftBar=true;
        }
        else if ((SDM.pm.contentType!="BK") && 1206 <= pgLayout.vpWidth) {
          pgLayout.pgLeft = 0;
          pgLayout.pgWidth = pgLayout.vpWidth;
          pgLayout.lcWidth = pgLayout.pgWidth-pgLayout.rcWidth-pgLayout.ccWidth-pgLayout.lcLeft;
          if(pgLayout.lcWidth>258)pgLayout.lcWidth=258;
          rightSidePane.openPane();
          $('#leftOpenBar').hide();
          Outline.sidebarOpen();
          pgLayout.showRightBar=true;
          pgLayout.showLeftBar=true;
        }
        else if ((SDM.pm.contentType!="BK") && 1020 <= pgLayout.vpWidth) {
          pgLayout.pgLeft = Math.floor(pgLayout.vpWidth/2) - 510;
          pgLayout.pgWidth = 1020;
          pgLayout.lcWidth = 20;
          pgLayout.lcLeft = 0;
          $(".toggleSideBar").show();
          rightSidePane.openPane();
          $('#leftOpenBar').show();
          page.delay(function(){ Outline.sidebarClose();}, pgLayout.holdAnimation);
          pgLayout.showRightBar=true;
          pgLayout.showLeftBar=false;
        }
        else if ((SDM.pm.contentType=="BK") && 1000 <= pgLayout.vpWidth) {
          pgLayout.pgLeft = Math.floor(pgLayout.vpWidth/2) - 490;
          pgLayout.pgWidth = 980;
          pgLayout.rcWidth = 20;
          pgLayout.lcLeft = 0;
          $(".toggleSideBar").show();
          $('#leftOpenBar').hide();
          Outline.sidebarOpen();
          if(pgLayout.showRightBar)page.delay(function(){rightSidePane.closePane();}, pgLayout.holdAnimation);
          pgLayout.showRightBar=false;
          pgLayout.showLeftBar=true;
        }
        else if (746 <= pgLayout.vpWidth) {
          $(".toggleSideBar").show();
          pgLayout.pgLeft = Math.floor(pgLayout.vpWidth/2) - 370;
          pgLayout.pgWidth = 746;
          pgLayout.lcWidth = 20;
          pgLayout.rcWidth = 20;
          $('#leftOpenBar').show();
          page.delay(function(){ Outline.sidebarClose();rightSidePane.closePane();}, pgLayout.holdAnimation);
          pgLayout.showRightBar=false;
          pgLayout.showLeftBar=false;
        }
        else {
          pgLayout.pgLeft = 0;
          pgLayout.pgWidth = 746;
          pgLayout.lcWidth = 20;
          pgLayout.rcWidth = 20;
          $('#leftOpenBar').show();
          $(".toggleSideBar").show();
          page.delay(function(){ Outline.sidebarClose();rightSidePane.closePane();}, pgLayout.holdAnimation);
          pgLayout.showRightBar=false;
          pgLayout.showLeftBar=false;
          $('html,body').css({'overflow-x': 'auto', 'overflow-y': 'hidden'});
        }

        if(pgLayout.showLeftBar==false) {
          $('#leftPane,#leftCloseBar').css('left', pgLayout.lcLeft);
          $('#leftPane').css('width', 258);
        }
        else{
          $('#leftPane,#leftCloseBar').css('left', pgLayout.lcLeft);
          $('#leftPane').css('width', pgLayout.lcWidth);
        }

        pgLayout.ccLeft=pgLayout.lcLeft+pgLayout.lcWidth;
        if(pgLayout.lcWidth<=20) {
          pgLayout.ccLeft-=2
        }
        pgLayout.rcLeft=pgLayout.ccLeft+pgLayout.ccWidth;
        $('#centerPane').css('left', pgLayout.ccLeft);
        $('#header-area,#page-area').css('width', pgLayout.pgWidth).css('left', pgLayout.pgLeft);
        if(pgLayout.showRightBar==false && $('#rightInner').css('display')!='none' && $('#rightPane').width()>20) {
          $('#rightInner').css('width',pgLayout.rcFloatWidth-22);
          $('#rightPane').css('width',pgLayout.rcFloatWidth).css('left',((pgLayout.ccLeft+pgLayout.ccWidth+20)-pgLayout.rcFloatWidth));
          $('#rightInner .innerPadding').width(pgLayout.rcFloatWidth-55);
          $('#rightInner .innerPaddingApp').width(pgLayout.rcFloatWidth-35);
          $('#rightInner .js_workspace_content').css('width','');
          $('#rightInner div.scrollArea').width(pgLayout.rcFloatWidth-50);
        }
        else if(pgLayout.showRightBar==true) {
          $('#rightPane').css('left',pgLayout.rcLeft).css('width',pgLayout.rcWidth);
          $('#rightInner').css('width',pgLayout.rcWidth-2);
          $('#rightInner .innerPadding').width(pgLayout.rcWidth-35);
          $('#rightInner .innerPaddingApp').width(pgLayout.rcWidth-15);
          $('#rightInner .js_workspace_content').css('width','');
          $('#rightInner div.scrollArea').width(pgLayout.rcWidth-40);
        }
        else {
          $('#rightPane').css('left',pgLayout.ccLeft+pgLayout.ccWidth);
          $('#rightInner .innerPadding, #rightInner .innerPaddingApp').width(pgLayout.rcWidth-35);
          $('#rightInner .js_workspace_content').css('width','');
        }

        page.objToolbar.css('width', pgLayout.pgWidth);
        page.objToolbarExt.css('width', pgLayout.pgWidth-27);
        if(SDU.isIE7())page.setPageHeight();
        if($('#centerPane').height()!='')$('#leftPane').height('').height($('#centerPane').height());
        rightSidePane.resizeAccordion();
      },
      setPageHeight: function(param,heightVal){
        var headerHeight=0,footerHeight=0,spareHeight=0;
        if ($('#header-area').is(':visible'))headerHeight=$('#header-area').height();
        if(headerHeight==0)spareHeight=3;
        $('#page-area').height($(window).height()-headerHeight-footerHeight-spareHeight);
        if($('#centerPane').height()!='')$('#leftPane').height('').height($('#centerPane').height());
      },
      toggleImages: function(zStr) {
	var imgObj=page.getCurrentImg();
        $('#centerInner dl.figure').each(function() {
            var img = $(this).find('img.figure');
            if(img.attr('id')!='gabsImg'){
              if(SDM.fullSize==true) {
                img.removeClass('smallImg');
                if(img.attr('src').indexOf(img.attr('data-thumbEID')) == -1) {
                  img.attr('src', SDM.imageUrlPrefix + img.attr('data-thumbEID'));
                  img.css('height', img.attr('data-thumbheight'));
                  img.css('width', img.attr('data-thumbwidth'));
                }
              }
              else {
                img.attr('data-loaded', 'false');
                img.attr('src', "/sd/grey_pxl.gif");
                img.css('height', img.attr('data-fullheight'));
                img.css('width', img.attr('data-fullwidth'));
                if(img.attr('data-fullwidth')>=580 && img.attr('data-fullwidth')<=800){
                    img.addClass('smallImg');
                    img.css('height', '').css('width', '');
                    img.removeAttr('height').removeAttr('width');
                }
              }
            }
        });
        if(SDM.fullSize==true) {
          SD_UTIL.sendUserKeyEvent('disableFullSizeImages', 'article', zStr, SDM.keOriginContentFamily);
          $('#optImgToggle').html("Show full-size images");
          setTimeout("ArticleToolbar.closeOptions('')",500);
          SDM.fullSize=false;
        }
        else {
          SDM.fullSize=true;
          $('#optImgToggle').html("Show thumbnail images");
          SD_UTIL.sendUserKeyEvent('enableFullSizeImages', 'article', zStr, SDM.keOriginContentFamily);
          setTimeout("ArticleToolbar.closeOptions('')",500);
        }
        $('#centerPane').lazyLoadImages({imgSel:'img.imgLazyJSB'});
        if(imgObj!=undefined)$('#centerPane').scrollTop(imgObj.positionA('#centerContent').top);
        //$('#centerPane').doTheScrollJitter();
      }, //toggleImages
      getCurrentImg:function(){
        var imgSel='img.imgLazyJSB';
        var totalCount=$(imgSel).size();
        var loopBool = true;
        for(i=0;i<totalCount && loopBool==true ;i++){
            var obj = $(imgSel)[i];
            if($(obj).positionA('#centerContent').top+$(obj).height()>=$('#centerPane').scrollTop() &&
               $(obj).positionA('#centerContent').top<=$('#centerPane').scrollTop()+$(window).height()){
                var imgObj = $(obj);
                loopBool=false;
            }
        }
        return imgObj;
      },
      lazyLoadInit: function() {
        $("img.imgLazyJSB").show();
        $('#centerPane').lazyLoadImages({imgSel:'img.imgLazyJSB'});  
        $('#outline').lazyLoadOutlineImages({imgSel:'img.smlImgLazyJSB'});  
      },
      lazyLoadFragInit: function(fragId) {
        $("img.imgLazyJSB").show();
        $('#'+fragId).lazyLoadImages({imgSel:'img.imgLazyJSB'});  
      },
      viewHandler: function( e ){
        $("#centerPane").unbind( "scroll.viewHandler", page.delayedScrollHandler );
        var h = $("#centerPane").height();
        var st = $("#centerPane").scrollTop();
        var sh = $('#centerPane')[0].scrollHeight;

        if( st > $('#centerPane').attr('data-st') ) { $('#centerPane').attr('data-dir', 'd'); }
        else { $('#centerPane').attr('data-dir', 'u'); }
        $('#centerPane').attr('data-st', $("#centerPane").scrollTop());
        if(st>20) {
          page.hideHeader();
        }
        else {
          page.showHeader();
        }
        $("#centerPane").bind("scroll.viewHandler", page.delayedScrollHandler );
      },
      hideHeader: function(){
        if($('#header-area').attr('data-dynamic')=='n') {return;}
        if($("#header-area").css('display') == 'none' || $('#centerPane').attr('data-st')=='d') {return;}
        $("#header-area").slideToggle(300);
        $("#page-area").css("border-top","3px solid #6c9d30");                
        $("#page-area").animate({"top": 0 },400, function() {
          setTimeout(function() {rightSidePane.resizeAccordion(); }, 400);
          if(SDU.isIE7())page.setPageHeight();
        });
        $('#leftPane').height('');
      },
      showHeader: function(){
        if($('#header-area').attr('data-dynamic')=='n') {return;}
        if($("#header-area").css('display') != 'none') {return;}
        $("#page-area").css("border-top","none");
        var height =  $("#header-area").height();
        if(height==0){
          $("#header-area").css({'visibility':'hidden','display':'block','height':'auto'});
          height = $("#header-area").height();
          $("#header-area").css({'visibility':'','display':'none'});
        }
        $("#header-area").slideToggle(300);         
        $("#page-area").animate({"top": height }, 300, function() {
            setTimeout(function() {rightSidePane.resizeAccordion(); }, 400);
            if(SDU.isIE7())page.setPageHeight();
        });                
        $('#leftPane').height('');
      },
      showLeftAd:function() {
        if(SDM.adPreventOutline == true) return;
        if ( typeof SDM.adArticleLeftURL!='undefined') {
            $("#articleLeftAd").append('<iframe scrolling="no" frameborder="0" border="0" cellspacing="0" src="' + SDM.adArticleLeftURL + '"></iframe>');
        }
      },
      adRemoveOutline:function() {
        $("#articleLeftAd").remove();
      },
      touchUpLeftAd:function() {
        $("#articleLeftAd iframe")[0].style.height = $("#articleLeftAd iframe")[0].contentWindow.document.body.offsetHeight + 'px';
        $("#articleLeftAd iframe")[0].contentWindow.document.body.style.background = "#ECF2F6";
      },
      updateRightAdLeftPosition:function(){
        var sidebarAd = $("#articleRightAd");
        if( sidebarAd.css( 'position' )== 'fixed' ){
          var rightInner = $("#rightInner"); // fixes the left position issue.
          sidebarAd.css({'left': (rightInner.offset().left - $(window).scrollLeft() ) });
        }
      },
      doHighlighting:function(ev) {
        var thisObj = $(ev.target).closest('a');
        var linkId = thisObj.attr('href');

        CollapsibleTextbox.openTboxForTarget(linkId.substring(1));
        $('#centerPane').moveTo(linkId.substring(1));
        ev.preventDefault();
      },
      showFullTableLink:function(){
        $("dl.table").each(function(i){
            var thisObj = $(this);
            if($(thisObj.find('.table')).width()<$(thisObj.find('table')).width()){
              $(thisObj.find(".fullsizeTable")).css('display','block');
            }
            if($(thisObj.find('.table')).width()<$(thisObj.find('dt img')).width()){
              $(thisObj.find(".fullsizeTable")).css('display','block');
            }
        });
      },
      searchWithinErrorMsg:function(msg) {
        $('#searchWithin .errorMsg').remove();
        $('#searchWithin').prepend('<div class="errorMsg"><div class="msg"><div class="alertIcon"></div><span>' + msg + '</span></div></div>').addClass('bookError');
        $('#outline').addClass('bookError');
        $('#outline').css('top',$('#searchWithin').outerHeight());
      },
      searchWithinErrorMsgClear:function() {
        $('#searchWithin, #outline').removeClass('bookError');
        $('#searchWithin .errorMsg').remove();
        $('#outline').css('top',$('#searchWithin').outerHeight());
      },
      searchWithinNoResult:function() {
        page.searchWithinErrorMsg('No results were found');
      },
      searchWithinNoTerms:function() {
        page.searchWithinErrorMsg('No search terms entered');
      },
      searchWithinInvalidSearch:function() {
        page.searchWithinErrorMsg('Invalid search format');
      },
      searchWithinSubmit:function() {
        var searchStr = $('#searchWithin input[type=text]').prop('value');
        if(searchStr=='' || searchStr =='Search this book') {
          page.searchWithinNoTerms();
          return;
        }
        page.searchWithinErrorMsgClear();
        if(searchStr.search('SW()')!=-1) {
          page.searchWithinInvalidSearch();
          SearchWithin.clear(true);
          return;
        }
        SearchWithin.clear();
        SearchWithin.saveSearch(0,searchStr);
        var rslt = SearchWithin.reqResult('#srcOutline li', page.selectorE_BK, page.opts.focus.idConvert, page.searchWithinNoResult);
      },
      searchWithinInit:function() {
        var val = SearchWithin.loadSearch();
        if(val==null || val.str=='' || val.str =='Search this book' || val.cid!=SDM.pm.cid) {
          SearchWithin.clear();
          $('#searchWithin input[type=text]').parent().siblings('.clearWithin').children().addClass('clearXHide').removeClass('clearXShow');
        }
        else {
          $('#searchWithin input[type=text]').prop('value', val.str);
          $('#searchWithin input[type=text]').parent().siblings('.clearWithin').children().removeClass('clearXHide').addClass('clearXShow');
          SearchWithin.init('#srcOutline li', page.selectorE_BK, page.opts.focus.idConvert, page.searchWithinNoResult);
        }
      },
      setupRelatedPDF:function() {
        $("#pdfLink").click(function(event) {
            event.stopPropagation();
            if (!($.browser.msie)) {
                event.preventDefault();
            }
            var t = $(event.currentTarget);
            if (t.attr("pdfurl")) {
              pdfCite.openPDF (t.attr("pdfurl"), event);
            }
            if (t.attr("suggestedarturl")) {
              pdfCite.suggestedArt (t.attr("suggestedarturl"));
              if (t.attr("citingArtURL")) {
                pdfCite.citedArtURL = t.attr("citingArtURL");
              }
            }
            else {
              pdfCite.suggestedArtDisplayed = false;
            }
            return true;
        });
      },
      addJS: function() {
        if($.browser.msie && $.browser.version <= 6) {return;}

        DynamicArtContent.buildDynamicRequestData();

        if ( $('#permissions')[0] && SDM.permAndReprint != '' ) {
          $('#permissions').html (SDM.permAndReprint);
        }

        ArticleToolbar.init();
        EReader.init();

        page.addDynamics();
        //page.hideFooter();
        if(SDM.entitled==true) {
            page.setupRelatedPDF();
        }

        //ArticleOutline.init();

        Fragment.init();
        
        mathRenderer.init();

        Outline.init();
        if(SDM.entitled==true && SDM.pageType=='article_full') {
          if(SDM.pm.contentType=="BK" || SDM.isMRWMODArticle) {
            page.opts.selector = page.selectorE_BK;
            if(SDM.pm.contentType=="BK")page.opts.searchWithin = true;
          }
          else {
            page.opts.selector = page.selectorE;
          }
          page.opts.focusEffect = true;
        }
        else {
          page.opts.focusEffect = false;
          if(SDM.pm.contentType=="BK" || SDM.isMRWMODArticle) {
            page.opts.selector = page.selectorUE_BK;
             if(SDM.pm.contentType=="BK")page.opts.searchWithin = true;
          }
          else {
            page.opts.selector = page.selectorUE;
          }
    
          if(!$('#centerInner div.articleOutlineHidden').length) {
            page.opts.empty = true;
            if(SDM.pm.contentType!='BK' && !SDM.isMRWMODArticle) {
              $('#outline').css('top', 0);
            }
            if(mrwLeftPane.currentTab=='S' && SDM.isMRWMODArticle)$('#outline .outlineMsg').hide();
          }
        }

        if (SDM.tocCacheAvail) {
          if(typeof SDM.tocJson != 'undefined') {
            DBG.out (1, "Found TOC JSON Already!!!");
            $('#centerInner').outline( $('#outline'), page.opts, SDM.tocJson );
            
            if($('#outline').width()>240){
              $('#outline > ul.srcOutline,#articleLeftAd').css('width', $('#outline').width()-$.scrollBarWidth());
            }else{
              $('#outline > ul.srcOutline,#articleLeftAd').css('width', 240);
            }
            $('#outline').attr('data-st', 0);
          }
          else {
            var tocCounter = 0;
            var trd = SDM.pm.toc.retryDelay;
            ///////////
            var tocCheck = function() {
              clearInterval(tocIntrvl);
              if(typeof SDM.tocJson != 'undefined' || tocCounter>SDM.pm.toc.retry) {
                  $('#centerInner').outline( $('#outline'), page.opts, SDM.tocJson );
                  $('#outline > ul > li').css('margin-right', $.scrollBarWidth());
                if($('#outline').width()>240){
                  $('#outline > ul,#articleLeftAd').css('width', $('#outline').width()-$.scrollBarWidth());
                }else{
                  $('#outline > ul,#articleLeftAd').css('width', 240);
                }

                $('#outline').attr('data-st', 0);
                $('#outline').scroll();
                if(SDM.pm.contentType=="BK") {
                  if(SDM.outlineTab=='I') {
                    EbookTOC.showItemTab($('#lpTabs .rightTab')[0]);
                  }
                  else {
                    EbookTOC.showSourceTab($('#lpTabs .leftTab')[0]);
                  }
                }
              }
              else {
                Outline.getJson ();
                tocCounter++;
                trd = trd*SDM.pm.toc.retryFactor;
                tocIntrvl = setInterval(tocCheck, trd);
              }
            }
            ///////////
            var tocIntrvl = setInterval(tocCheck, trd);
          }
        }
        else {
         $('#centerInner').outline( $('#outline'), page.opts );
         $('#outline > ul > li').css('margin-right', $.scrollBarWidth());
            if($('#outline').width()>240){
                $('#outline > ul,#articleLeftAd').css('width', $('#outline').width()-$.scrollBarWidth());
            }else{
                $('#outline > ul,#articleLeftAd').css('width', 240);
            }

         $('#outline').attr('data-st', 0);
        }
        $('#outline').attr('data-st', 0);

        CollapsibleTextbox.init();

        page.delayedScrollHandler = _.debounce( page.viewHandler, 300 );
        $( "#centerPane" ).bind( "scroll.viewHandler", page.delayedScrollHandler );

        $("#page-area").on("click", ".intra_ref,.authorVitaeLink,.figureLink,.authorName, .viewWS", {z:'centerPane'}, rightSidePane.findTargetElement);

        if (Fragment.isAvail())
           $("#outline").on("click", ".tocLink", {z:'leftPane'}, Outline.findTargetFragment);
        else 
           $("#outline").on("click", ".tocLink", Outline.moveToSection);
 
        $("#centerPane").on('click', '.btnHolder', function(e){page.toggleOptions(e,this);} );
        $('a.articleOptions').toggle(
            function() { $('div.articleOptions').css('display', 'block');},
            function() { $('div.articleOptions').css('display', 'none');}
        );
        $('#optImgToggle').click(function() {page.toggleImages('toolbar');});
        $('#leftPane').height('');

        page.lazyLoadInit();

        page.showFullTableLink();
        $('div.downloadCsv').bind("click", TableDownload.processRequest);
        $('a.ppt').bind("click", FigureDownload.processRequest);

        if(SDM.pm.contentType == "BK") EbookTOC.init();
        if(SDM.isMRWMODArticle && SDM.ldrAvail) {$('.outlineMsg').hide();mrwLeftPane.init();}

        EComponent.init();
        CanonicalLink.init();
        CanonicalHomeLink.init();
        page.searchWithinInit();

         if(!SDM.crawlerAvail) { refResolve(); }
        if(SDM.displayGadgets) {
          if (SDM.sciverseGadgetDetailsID.length > 0) {
            GadgetUtil.loadGadgetsParallel();
          } else {
          GadgetUtil.loadGadgets();
        }
        }
        Outline.hoverOverOff();

        $('#centerPane')[0].tabIndex = -1;
        $('#centerPane')[0].focus();

	if (typeof(SDM.fab) != 'undefined' && SDM.pm.itemWeight == 'FULL-TEXT') { EReader.fabRequest(); }

        ready=true;     
      } //addJS
    } //page

    if($('#frag_1').length || !Fragment.isAvail()) {
      page.addJS();
    }
    else {
      var if1 = setInterval(function() {
        if($('#frag_1').length) {
          clearInterval(if1);
          page.addJS();
        }
        else {
          //nothing wait for it
        }
      }, 250);
    }
    return page;
  }();
} //initializeArticlePage

function checkSearchWithin() {
  if($('#searchWithin input[type=text]').prop('value')=='') {
    $('#searchWithin input[type=text]').parent().siblings('.clearWithin').children().addClass('clearXHide').removeClass('clearXShow');
  }
  else {
    $('#searchWithin input[type=text]').parent().siblings('.clearWithin').children().removeClass('clearXHide').addClass('clearXShow');
  }
}

$.fn.outline = function(oObj, opts, tocJson) {
  var cfg = {
    empty: false,
    selector: '.outlineItem',
    graphicsToggler: true,
    searchWithin: false,
    focusEffect: true,
    focus: {}
  };
  Outline.oObj = oObj;

  return this.each(function() {
    if(opts) {
      $.extend(true, cfg, opts);
    }

    oObj.append('<ul id="itemOutline"></ul>');
    var $iOutline = $('#itemOutline');
    if(cfg.graphicsToggler) {
    $('#outline.js').css('top', 32);
    if(SDM.pm.contentType=="BK") {
       $('#outline.book').css('top', 44);
    }
    if(SDM.isMRWMODArticle) {
       $('#outline.book').css('top', 10);
    }
    
    oObj.parent().prepend('<div id="olGraphCbBox">'
            + '<label><input id="outlineGraphicsCheckBox" type="checkBox" checked="true">Show thumbnails in outline</label>'
            + '</div>');
    }
    if(cfg.searchWithin) {
      oObj.parent().prepend('<div id="searchWithin" class="textEntry" role="Search" aria-label="Book">'
          + '<form name="searchWithinForm" action="javascript:checkSearchWithin();ArticlePage.searchWithinSubmit();">'
          + '<input type="text" value="Search this book" title="Search this book" size="26" maxlength="450"></input></form>'
          + '<button class="clearWithin" title="Clear book search"><div class="clearXHide"></div></button>'
          + '<button class="submit" title="Search this book"></button>'
          + '</div>');
      $('#searchWithin button.clearWithin').click(function() {
          $('#searchWithin input[type=text]').prop('value', 'Search this book');
          $(this).children().addClass('clearXHide').removeClass('clearXShow');
          SearchWithin.clear();
      });
      $('#leftPane button.submit').click(function() {ArticlePage.searchWithinSubmit();});

      $('#searchWithin input[type=text]').focusin(function() {
          if($(this).prop('value')=='Search this book') {
            $(this).prop('value', '');
          }
      });
      $('#searchWithin input[type=text]').focusout(function() {
          if($(this).prop('value')=='') {
            $(this).prop('value', 'Search this book');
            $(this).parent().siblings('.clearWithin').children().addClass('clearXHide').removeClass('clearXShow');
          }
          else {
            $(this).parent().siblings('.clearWithin').children().removeClass('clearXHide').addClass('clearXShow');
          }
      });
    }
    var level = "";
    var isGraphics = false;
    prs.rt('outlineLoop_start');

    if (SDM.tocCacheAvail) {
      if(typeof tocJson == 'undefined') {
        //miss and retries are done
        Outline.buildOutlineUnavailable(cfg);
        Outline.postBuild(cfg);
      }
      else {
        // build outline from JSON
        var outlineObj;
        try {
          outlineObj = $.parseJSON(tocJson);
          Outline.buildOutlineJsonSide(cfg, outlineObj);
        }
        catch(e) {
          SDM.tocCacheAvail = false;
          $.get(SDM.urlPrefix + "/outlineJson/" + SDM.pm.pii + "/" + SDM.pm.cid + "/ftp");
          if(Fragment.isAvail()) {
            //Pull in the rest of the article and build it clientside
            Fragment.get('all', null, {successCb: Outline.buildOutlineClientSide,
                                       successCbArg: cfg,
                                       failureCb: Outline.buildOutlineUnavailable,
                                       failureCbArg: cfg
                                      });
            return;
          }
          else {
            Outline.buildOutlineClientSide(cfg);
          }
        }
      }
    }
    else {
      // Build outline from center pane contents
      Outline.buildOutlineClientSide(cfg);
    }

  }); //return
  if(mathRenderer.opt.renderOn)mathRenderer.handleRerender($('#rightPane'));
} //.outline

var CrossMark = {
  cssUrl:'',
  init:function() {
    $("#open-crossmark").delegate("#crossmark-icon", "click",function(event){
        $.get(SDM.crossMarkURL +'/'+  SDM.pm.pii + '/article/rightPane/displayPopup/' + SDM.keOriginContentFamily +'/'+ SDM.issn_or_isbn);
    });
    if($('#open-crossmark')[0]){
      LazyLoad.js([SDM.crossMarkLib], function() {
           $("#open-crossmark").css({'display':'inline-block'}).find('img').css('padding-top','10px');
           $('#open-crossmark').click(function(){$(".ui-dialog-titlebar").css('top','0px').css('width','520px');});
      });
    }
    $('#open-crossmark').bind('mouseover',function(){setTimeout(CrossMark.setCss,1000);});
    $('#open-crossmark').bind('mouseout',function(){setTimeout(CrossMark.removeCss,1000);});
    $('body').bind('mousemove',CrossMark.removeCss);
  },
  setCss:function(){
     if(!$('link[href*="crossmark_widget.css"]')[0]){
	if(document.createStyleSheet){
	   document.createStyleSheet(CrossMark.cssUrl);
        }else{
           $('head').append('<link href="'+CrossMark.cssUrl+'" rel="stylesheet" type="text/css"/>');
        } 
     }else{
        CrossMark.cssUrl=$('link[href*="crossmark_widget.css"]').attr('href');
     }
  },
  removeCss:function(){
     if($('link[href*="crossmark_widget.css"]')[0] && !$('.ui-widget-overlay').is(':visible') && !$('#crossmark-tooltip-130').is(':visible')){
        CrossMark.cssUrl=$('link[href*="crossmark_widget.css"]').attr('href');
        $('link[href*="crossmark_widget.css"]').remove();
     }
  }
}

var SearchWithin = {
  init:function(bkOutlineSelStr, selStr, idConvert, funcNoResult) {
    var val = SearchWithin.loadSearch();
    if(val.cid==SDM.pm.cid && val.str) {
      var swObj = SearchWithin.loadResult();
      if(swObj) {
        if(swObj && swObj.cid==SDM.pm.cid) {
          if(swObj.status!=0) {
            SearchWithin.clear();
          }
          else {
            SearchWithin.processResult(swObj, bkOutlineSelStr, selStr, idConvert);
          }
        }
        else {
          SearchWithin.reqResult(bkOutlineSelStr, selStr, idConvert, funcNoResult);
        }
      }
      else {
        SearchWithin.reqResult(bkOutlineSelStr, selStr, idConvert, funcNoResult);
      }
    }
  },
  loadSearch:function() {
    var flag=true;
    var searchStr='';
    var cidStr = '';
    var beg = document.cookie.indexOf('SEARCHWITHIN=');
    if(beg!=-1) {
      beg = beg + 'SEARCHWITHIN='.length;
      var end = document.cookie.indexOf(';', beg);
      var cookieStr = document.cookie.slice(beg, end);
      flag = cookieStr.split('SW()')[0];
      searchStr = cookieStr.split('SW()')[1];
      cidStr = cookieStr.split('SW()')[2];
    }
    else {
      return {f:'',str:'',cid:''};
    }
    return {f:flag,str:searchStr,cid:cidStr}; //[searchStr, cidStr];
  },
  saveSearch: function(f, sStr) {
    var site = document.location.pathname.split('/article/pii/')[0];
    document.cookie='SEARCHWITHIN' + '=' + f + 'SW()' + sStr + 'SW()' + SDM.pm.cid + ';;path=' + site;
  },
  reqResult: function(bkOutlineSelStr, selStr, idConvert, funcNoResult) {
    $.get('/science/searchwithin', function(res) {
        var result;
        try {
          result = $.parseJSON(res);
        }
        catch(e) {
          DBG.out(1, 'SearchWithin failed');
          return;
        }
        if(result.status==1 || typeof result.hitTerms=="undefined") {
          funcNoResult();
        }
        else {
          if(result.status==0) {
            SearchWithin.processResult(result, bkOutlineSelStr, selStr, idConvert);
			$('#outline').scrollTop($('#outline a.swh:first').position().top);
          }
        }
    });
  },
  processResult: function(result, bkOutlineSelStr, selStr, idConvert) {
    var len = result.piis.length;
    for(var i=0; i<len; i++) {
      if(SDM.pm.pii==result.piis[i]) {
        SearchWithin.hlCenterPane(result.hitTerms.toString().replace(/,/g, ' '), selStr, idConvert);
      }
    }
    SearchWithin.hlOutline(result.piis, bkOutlineSelStr);
    SearchWithin.saveResult(result);
  },
  saveResult: function(rslt) {
    if(SDU.cookieAvail()&&SDU.sessionStorageAvail()&&typeof JSON!='undefined') {
      sessionStorage.setItem('bk.sw', JSON.stringify(rslt));
    }
  },
  loadResult: function() {
    if(SDU.cookieAvail()&&SDU.sessionStorageAvail()) {
      var sw = sessionStorage.getItem('bk.sw');
      if(sw) {
        var swObj = $.parseJSON(sw);
        if(swObj.cid==SDM.pm.cid) {
          return swObj;
        }
        else {
          SearchWithin.clearResult();
          return null;
        }
      }
      else {
        SearchWithin.clearResult();
        return null;
      }
    }
  },
  clearResult: function() {
    if(SDU.cookieAvail()&&SDU.sessionStorageAvail()) {
      sessionStorage.removeItem('bk.sw');
    }
  },
  clear:function(keepMsg) {
    $('.swh').removeClass('swh');
    $('.searchword').removeClass('searchword');
    var site = document.location.pathname.split('/article/pii/')[0];
    document.cookie = 'SEARCHWITHIN' + '=; expires=Fri, 01-Jan-70 01:02:03 UTC;';
    document.cookie = 'SEARCHWITHIN' + '=; expires=Fri, 01-Jan-70 01:02:03 UTC;path=' + site;
    if(typeof keepMsg=="undefined" && typeof ArticlePage!="undefined")
      ArticlePage.searchWithinErrorMsgClear();
  }, //searchWithin.clear

  hlOutline:function(piis, selStr) {
    var len = piis.length;
    for(var i=0; i<len; i++) {
      $(selStr).each(function() {
          if($(this).attr('data-pii')==piis[i]) {
            DBG.out(1, 'Highlighting Book TOC item ' + $(this).text());
            if($(this).attr('data-pii')!=SDM.pm.pii) {
                 $(this).find('div a').addClass('swh');
            }
            EbookTOC.getPath2Item(piis[i]).each(function() {
                $(this).children('a').addClass('swh');
            });
          }
      });
    }
  },

  hlCenterPane:function(hitTerms, selStr, idConvert) {
    searchStr = hitTerms;

    //center pane highlighting
    searchhi.process($('#centerPane')[0], searchStr);
    //outline highlighting
    var objs = $('.searchword').each(function() {
        $(this).attr('data-posy', $(this).position().top);
    });
    $(selStr).each(function() {
       $(this).attr('data-posy', $(this).position().top);
       objs.push(this);
    });
    objs = _.sortBy(objs, function(val) {
        return $(val).attr('data-posy')*1.0;
    });
    objs = _.filter(objs, function(val) {
        return $(val).parents('.textboxBody').length==0;
    });
    objs = objs.reverse();
    var len = objs.length;
    for(i=0; i<len; i++) {
      var $c = $(objs[i]);
      if($c.hasClass('searchword')) {
        var ii=i;
        while($(objs[ii]).length && $(objs[ii]).hasClass('searchword')) {ii++;}
        $('#' + idConvert($(objs[ii]).attr('id'))).addClass('swh');
        var foundType="h4";
        if($(objs[ii]).is("h4")) {
          foundType = "h4";
        }
        if($(objs[ii]).is("h3")) {
          foundType = "h3";
        }
        if($(objs[ii]).is("h2")) {
          foundType = "h2";
          done=true;
        }

        var done=false;
        while(!done && $(objs[ii]).length) {
          if(foundType=="h4") {
            if($(objs[ii]).is("h4")) {}
            if($(objs[ii]).is("h3")) {
              $('#' + idConvert($(objs[ii]).attr('id'))).addClass('swh');
            }
            if($(objs[ii]).is("h2")) {
              done=true;
              $('#' + idConvert($(objs[ii]).attr('id'))).addClass('swh');
            }
          }
          else if(foundType=="h3") {
            if($(objs[ii]).is("h4")) {}
            if($(objs[ii]).is("h3")) {}
            if($(objs[ii]).is("h2")) {
              $('#' + idConvert($(objs[ii]).attr('id'))).addClass('swh');
              done=true;
            }
          }
          if($(objs[ii]).is("h2")) {
            done=true;
          }
          ii++;
        }
      }
    }
  }//searchWithin.highlight

} //SearchWithin

var ArticleOutline={
outline : "",

init:function(){
//var toc = $.parseJSON(ArticleOutline.outline);
  if(typeof SDM.tocJson !='undefined')
  {
    var obj = $.parseJSON(SDM.tocJson);

	for (var i=0;i<=obj.TOC.length;i++) {
	 ArticleOutline.buildSectionItem(obj.TOC[i]);
	}
  }
},

buildSectionItem:function(sec){
//var $section;
var html = '';
var keyE = '"displayTOCSection", "article", "leftPane", '+SDM.keOriginContentFamily +'';
//$section = $('<li class="" style="margin-right:16px;"></li>');
  if(sec.sID != undefined){
  html += '<div id="ol_'+sec.sID+'" class="io item h2sec"></div>';
    //$section.append('<div id="ol_'+sec.sID+'" class="io item h2sec"></div>');
  }
  if(sec.sT != undefined){
    html += '<a onclick="SD_UTIL.sendUserKeyEvent(\'displayTOCSection\', \'article\', \'leftPane\', '+SDM.keOriginContentFamily +'); return $(\'#centerPane\').moveTo(\''+ sec.sID +'\')"  href=\'#'+sec.sID+'\' >'+sec.sT+'</a>';
  }
  
  //$section.append($div);
  return html;
}
}

var Outline = {
  onHover:false,
  pendCloseTimer:null,
  init:function() {
    $('#leftPane').hover(
        function() {
          Outline.hoverOverOn();
          if(!pgLayout.showLeftBar) {
            clearTimeout(Outline.pendingCloseTimer);
          }
        }, 
        function() { 
          Outline.hoverOverOff();
          if(!pgLayout.showLeftBar) {
            Outline.pendingCloseTimer = setTimeout(Outline.sidebarClose, 1000);
          }
        } 
    );
    $('#leftCloseBar').click(function(e) {Outline.sidebarOpenClick(e)});
    $('#leftOpenBar').click(function(e) {Outline.sidebarCloseClick(e)});
  },
  buildOutlineJsonSide:function(cfg, outlineObj) {
    var $iOutline = $('#itemOutline');
      if (outlineObj!=null && outlineObj.TOC != undefined && outlineObj.TOC.length>1) {
        $(outlineObj.TOC).each(function(i, h2Sec) {
          if(h2Sec.sT != undefined && h2Sec.sT.length>0){
            var secTitle = h2Sec.sT;
            secTitle = secTitle.replace (/&#39;/g, "'"); 
            if (SDM.pageType == 'article_full') { 
              $iOutline.append(Outline.addItemSection(h2Sec.sID, secTitle, 'h2'));
            } else if (SDM.pageType == 'article_abs') {
              $iOutline.append(Outline.addItemOutline(h2Sec.sID, secTitle, 'h2'));
            }
          }
          if(h2Sec.faID != undefined && h2Sec.faID.length > 0) {
            $(h2Sec.faID).each(function(i, floatanc) {
              if(floatanc.fT == 'fig'){
                var imageURL = SDM.imageUrlPrefix + outlineObj.EID + '-' + floatanc.fI;
                if(floatanc.fI.length>0){
                  $iOutline.append(Outline.addItemFig(floatanc.fID, floatanc.fL, imageURL, 'h2', floatanc.fIh));
                }
              }
              else if(floatanc.fT == 'tbl'){
                $iOutline.append(Outline.addItemTbl(floatanc.fID, floatanc.fL, 'h2'));
              }
              else if(floatanc.fT == 'ecomp'){
                $iOutline.append(Outline.addItemMMC(floatanc.fID, floatanc.fL, floatanc.floatEXT, 'h2'));
              }
            })
          }
          if (h2Sec.cT != undefined && h2Sec.cT.length > 0) {
            $(h2Sec.cT).each(function(i, h3Sec) {
              if(h3Sec.sT.length>0){
                var secTitle = h3Sec.sT;
                secTitle = secTitle.replace (/&#39;/g, "'"); 
                if (SDM.pageType == 'article_full') {
                  $iOutline.append(Outline.addItemSection(h3Sec.sID, secTitle, 'h3'));
                }else if (SDM.pageType == 'article_abs'){
                  $iOutline.append(Outline.addItemOutline(h3Sec.sID, secTitle, 'h3'));
                }
              }
              if(h3Sec.faID != undefined && h3Sec.faID.length > 0){
                $(h3Sec.faID).each(function(i, floatanc){
                  if(floatanc.fT == 'fig'){
                    var imageURL = SDM.imageUrlPrefix + outlineObj.EID + '-' + floatanc.fI;
                    if (floatanc.fI.length>0){
                      $iOutline.append(Outline.addItemFig(floatanc.fID, floatanc.fL, imageURL, 'h3', floatanc.fIh));
                    }
                  }
                  else if(floatanc.fT == 'tbl'){
                    $iOutline.append(Outline.addItemTbl(floatanc.fID, floatanc.fL, 'h3'));
                  }
                  else if(floatanc.fT == 'ecomp'){
                    $iOutline.append(Outline.addItemMMC(floatanc.fID, floatanc.fL, floatanc.floatEXT, 'h3'));
                  }
                })
              }
              if(h3Sec.cT != undefined && h3Sec.cT.length > 0){
                $(h3Sec.cT).each(function(i, h4Sec) {
               	if(h4Sec.sT.length>0){
                  var secTitle = h4Sec.sT;
                  secTitle = secTitle.replace (/&#39;/g, "'"); 
                  if (SDM.pageType == 'article_full') {
                    $iOutline.append(Outline.addItemSection(h4Sec.sID, secTitle, 'h4'));
                  }else if (SDM.pageType == 'article_abs'){
                    $iOutline.append(Outline.addItemOutline(h4Sec.sID, secTitle, 'h4'));
                  }
                }
                  if(h4Sec.faID != undefined && h4Sec.faID.length > 0){
                    $(h4Sec.faID).each(function(i, floatanc){
                      if(floatanc.fT == 'fig'){
                        var imageURL = SDM.imageUrlPrefix + outlineObj.EID + '-' + floatanc.fI;
                        $iOutline.append(Outline.addItemFig(floatanc.fID, floatanc.fL, imageURL, 'h4', floatanc.fIh));
                      }
                      else if(floatanc.fT == 'tbl'){
                        $iOutline.append(Outline.addItemTbl(floatanc.fID, floatanc.fL, 'h4'));
                      }
                      else if(floatanc.fT == 'ecomp'){
                        $iOutline.append(Outline.addItemMMC(floatanc.fID, floatanc.fL, floatanc.floatEXT, 'h4'));
                      }
                    })
                  }
                })
              }
            })
          }
        })
        $('#leftPane .outlineMsg').remove();
      }
      else {
        if(SDM.pm.contentType!='BK' && !SDM.isMRWMODArticle) {
          $('#outline').css('top', 0);
        }
        $('#outline .outlineMsg').html('This document does not have an outline.')
                  	         .show();
        if(mrwLeftPane.currentTab=='S' && SDM.isMRWMODArticle)$('#outline .outlineMsg').hide();
      }
      Outline.postBuild(cfg);
  },
  buildOutlineClientSide:function(cfg) {
    var level = "";
    var $iOutline = $('#itemOutline');
    if($(cfg.selector).length>0) {
      $(cfg.selector).each(function() {
        if($(this).parents('.textboxBody').length>0) {}
        else {
          if($(this).attr('id')==undefined) {
            $(this).attr('id', 'bs_' + Math.floor(Math.random()*100000));
            DBG.out(1, 'fixing id::' + $(this).attr('id') + '::'  + $(this).text());
          }
          DBG.out(4, 'adding::' + $(this).text());

          if($(this).is("h2")||$(this).is("h3")||$(this).is("h4")) {
            level = $(this)[0].tagName;
            level = level.toLowerCase();
            var label = $(this).html();
            var hasMml=$(this).find("#itemOutline .mathmlsrc"); 
            if(hasMml) { 
              $("#itemOutline .mathmlsrc").attr('onclick',''); 
            }
            if(label==undefined) label='';
            if (SDM.pageType == 'article_full') {
              $iOutline.append(Outline.addItemSection($(this).attr('id'), label, level));
            }
            else if (SDM.pageType == 'article_abs') {
              //Note: In case of unentitled view we render the outline from a hidden div in center pane
              $iOutline.append(Outline.addItemOutline($(this).attr('id'), label, level));
            }
          }
          else {
            if($(this).hasClass('table')==true) {
              var label = $(this).attr('data-label');
              if(label==undefined) label='';
              $iOutline.append(Outline.addItemTbl($(this).attr('id'), label, level));
            }
            else if($(this).hasClass('figure')==true) {
              var label = $(this).find(".label").html();
              if(label==undefined) label='';
              var image = SDM.imageUrlPrefix + $(this).find("dt img").attr('data-thumbEID');
              var thumbHeight = $(this).find("dt img").attr('data-thumbheight');
              if(!$(this).children('div').attr('id')){
                $iOutline.append(Outline.addItemFig($(this).attr('id'), label, image, level, thumbHeight));
              }
            }
            else if($(this).hasClass('ecomponent')==true) {
              var label = $(this).attr('data-label');
              if(label==undefined) label='';
              var ext = $(this).attr('data-ext');
              $iOutline.append(Outline.addItemMMC($(this).parent('dl').attr('id'), label, ext, level));
            }
            else {}
          }
        }
      })
      $('#leftPane .outlineMsg').remove();
    }
    else {
      if(SDM.pm.contentType!='BK' && !SDM.isMRWMODArticle) {
        $('#outline').css('top', 0);
      }
      $('#outline .outlineMsg').html('This document does not have an outline.')
                               .show();
      if(mrwLeftPane.currentTab=='S' && SDM.isMRWMODArticle)$('#outline .outlineMsg').hide();
    }
    Outline.postBuild(cfg);
  },
  buildOutlineUnavailable:function(cfg) {
    if(SDM.pm.contentType!='BK') {
      $('#outline').css('top', 0);
    }
    $('#outline .outlineMsg').html('The outline for this document is currently unavailable.')
                  	         .show();
  },
  postBuild:function(cfg) {
    var oObj = Outline.oObj;
    prs.rt('outlineLoop_end');
    oObj.append('<div id="articleLeftAd"></div>');
    Outline.showLeftAd();
    
    //Setup the sync between rightPane scroll and outline highlight
    if(cfg.focusEffect==true) {
      oObj.syncTo(cfg);
    }
    
    $('#outline > ul').show();
    if(SDM.isMRWMODArticle && SDM.ldrAvail)$('#itemOutline').hide(); 
    
    if(SDM.outlineImgFence==true)  {
      if($('li div.fig, li div.tbl, li div.mmc').length > 0) {
        if(SDM.outlineGraphics == true) {
          $('#outlineGraphicsCheckBox').prop('checked', true);
        }
        else {
          $('#outlineGraphicsCheckBox').prop('checked', false)
          $('li div.fig, li div.tbl, li div.mmc').parent().hide();
        }
        $('#outlineGraphicsCheckBox').change(function() {
            Outline.toggleGraphics();
            if($('#outlineGraphicsCheckBox').prop('checked')==true) {
              SD_UTIL.sendUserKeyEvent('enableOutlineGraphics', 'article', 'leftPane', SDM.keOriginContentFamily);
            }
            else {
              SD_UTIL.sendUserKeyEvent('disableOutlineGraphics', 'article', 'leftPane', SDM.keOriginContentFamily);
            }
        });
      }
      else {
        $('#outlineGraphicsCheckBox').prop('checked', false);
        $('#olGraphCbBox label').hide();
      }
    }
    else {
      $('#olGraphCbBox').hide();
      $('#outlineGraphicsCheckBox').prop('checked', false)
      $('li div.fig, li div.tbl, li div.mmc').parent().hide();
    }
    oObj.scroll();
  },
  itemAction: function() {
    SD_UTIL.sendUserKeyEvent('displayTOCSection', 'article', 'leftPane', '" + SDM.keOriginContentFamily + "');
    
  },
  addItemMMC: function(hashId, lbl, ext, hStr) {
    var ecn = "olIconMMCDef";
    if(ext=="pdf"){extCls="olIconMMCPdf"}
    else if(ext=="avi"){ecn="olIconMMCMov"}
    else if(ext=="csv"){ecn="olIconMMCCsv"}
    else if(ext=="eps"){ecn="olIconMMCEps"}
    else if(ext=="flv"){ecn="olIconMMCFlv"}
    else if(ext=="gif"){ecn="olIconMMCImg"}
    else if(ext=="jpg"){ecn="olIconMMCJpg"}
    else if(ext=="kmz"){ecn="olIconMMCDef"}
    else if(ext=="mml"){ecn="olIconMMCDef"}
    else if(ext=="xls"){ecn="olIconMMCExcel"}
    else if(ext=="ppt"){ecn="olIconMMCPpt"}
    else if(ext=="doc"){ecn="olIconMMCWord"}
    else if(ext=="mp3"){ecn="olIconMMCAud"}
    else if(ext=="mpg"){ecn="olIconMMCMov"}
    else if(ext=="mp4"){ecn="olIconMMCMpg4"}
    else if(ext=="txt"){ecn="olIconMMCTxt"}
    else if(ext=="png"){ecn="olIconMMCPng"}
    else if(ext=="mov"){ecn="olIconMMCMov"}
    else if(ext=="rtf"){ecn="olIconMMCRtf"}
    else if(ext=="svg"){ecn="olIconMMCSvg"}
    else if(ext=="tar"){ecn="olIconMMCDef"}
    else if(ext=="tif"){ecn="olIconMMCDef"}
    else if(ext=="zip"){ecn="olIconMMCZip"}
    else {ecn = "olIconMMCDef";}

    var html;
    if(SDM.entitled==true){
      html = "<li><div id='ol_" + hashId + "' class='tocLink io item " + hStr + "sec mmc'>"
           + "<a class=\"tocLink olIcon " + ecn + "\" href='#" + hashId + "' onClick=\"SD_UTIL.sendUserKeyEvent('displayTOCSection', 'article', 'leftPane', '" + SDM.keOriginContentFamily + "'); \"> <div class=\"olIcon " + ecn + "\"></div>"
           + lbl + "</a></div></li>";
    }
    else{
      html = "<li><div id='ol_" + hashId + "' class='io item " + hStr + "sec mmc'>"
           + "<a class=\"tocLink olIcon " + ecn + "  cLink\"  queryStr='" + SDM.urlTOCLinkQueryStr + "' href='" + SDM.urlTOCLink + "'\> <div class=\"olIcon " + ecn + "\"></div>"
           + lbl
           + "</a></div></li>";
    }
    return html;
  },  //Outline.addItemMMC
addItemTbl: function(hashId, lbl, hStr) {
    var html;
     if(SDM.entitled==true){
     html = "<li><div id='ol_" + hashId + "' class='io item " + hStr + "sec tbl'>"
             + "<a class=\"tocLink olIcon olIconTbl\" href='#" + hashId + "' onClick=\"SD_UTIL.sendUserKeyEvent('displayTOCSection', 'article', 'leftPane', '" + SDM.keOriginContentFamily + "'); \"><div class=\"olIcon olIconTbl\"></div>" 
             + lbl + "</a></div></li>";
    }
    else{
    html = "<li><div id='ol_" + hashId + "' class='io item " + hStr + "sec tbl'>"
             + "<a class=\"olIcon olIconTbl  cLink\"  queryStr='" + SDM.urlTOCLinkQueryStr + "' href='" + SDM.urlTOCLink + "'\><div class=\"olIcon olIconTbl\"></div>" 
             + lbl + "</a></div></li>";
    }
    return html;
  },  //Outline.addOutlineItemTbl
  addItemFig: function(hashId, lbl, img, hStr, thumbHeight) {
    var html;
    if(SDM.entitled==true){
      html = "<li><div id='ol_" + hashId + "' class='io item " + hStr + "sec fig'>"
             + "<a class='tocLink' href='#" + hashId + "' onClick=\"SD_UTIL.sendUserKeyEvent('displayTOCSection','article','leftPane', '" + SDM.keOriginContentFamily + "');\">"

      html += "<img src=\"/sd/grey_pxl.gif\"  class=\"smlImgLazyJSB greyImg\" data-smlsrc='" + img + "' data-thumbheight='" + thumbHeight + "'/></a></div></li>";

    }else{
      html = "<li><div id='ol_" + hashId + "' class='io item " + hStr + "sec fig'>"
           + "<a class=\"olIcon olIconFig  cLink\"  queryStr='" + SDM.urlTOCLinkQueryStr + "' href='" + SDM.urlTOCLink + "'\>" 
           + "<img src=\"/sd/grey_pxl.gif\"  class=\"smlImgLazyJSB greyImg\" data-smlsrc='" + img + "' data-thumbheight='"+thumbHeight + "'/>"
           + "</a></div></li>";
                }
    return html;
  },    //Outline.addOutlineItemFig

  addItemSection: function(hashId, lbl, hStr) {
    var html = "<li><div id='ol_" + hashId + "' class='io item " + hStr + "sec'>"
             + "<a class='tocLink'href='#" + hashId + "' onClick=\"SD_UTIL.sendUserKeyEvent('displayTOCSection', 'article', 'leftPane', '" + SDM.keOriginContentFamily + "');\">"
             + lbl + "<br>"
             + "</a></div></li>";
    return html;
  }, //Outline.addOutlineItemSection

  addItemOutline: function(hashId, lbl, hStr) {
    var html = "<li><div class='io item " + hStr + "sec'>"
             + "<a class='cLink' queryStr='" + SDM.urlTOCLinkQueryStr + "' href='" + SDM.urlTOCLink + "'\>"
             + lbl + "<br>"
             + "</a></div></li>";
    return html;
  }, //Outline.addOutlineItemSection
  sidebarOpenClick: function(e) {
    Outline.sidebarOpen(true);
    SD_UTIL.sendUserKeyEvent('openLeftPane', 'article', 'leftPane', SDM.keOriginContentFamily);
    return false;
  },
  sidebarCloseClick: function(e) {
    Outline.sidebarClose();  
    SD_UTIL.sendUserKeyEvent('closeLeftPane', 'article', 'leftPane', SDM.keOriginContentFamily);
    return false;
  },
  sidebarOpen: function(e) {
    if($('#leftPane').css('display')=='none') {
      $('#leftCloseBar').hide();
      $('#leftPane').height('').height($('#leftPane').height()).show();
      $('#leftPane').animate({'margin-left':'0px'}, 250, function() {
          var ol = $('#outline');
          ol.css('overflow-y', 'auto');
          if(ol.attr('data-st')==undefined|| ol.attr('data-st')==0) {}
          else {
            ol.scrollTop(ol.attr('data-st'));
          }
          ol.css('overflow-y', 'hidden');
          if(e==true) {
            Outline.hoverOverOn();
          }
      });
    }
  },
  sidebarClose: function() {
    if($('#leftPane').css('display')=='block' && $('#leftPane').attr('data-closing')!='y') {
      var ol = $('#outline');
      var st = ol.scrollTop();
      ol.attr('data-st', st);
      ol.css('overflow-y', 'hidden');
      $('#leftPane').attr('data-closing', 'y');
      $('#leftPane').height('').height($('#leftPane').height());
      $('#leftPane').animate({'margin-left':'-280px'},250,function(){
	  $(this).hide();
          $('#leftCloseBar').show();
          $('#leftPane').attr('data-closing', '');
      });
    }
  },
  collapseSmallLeft: function() {
  }, //Outline.collapseSmallLeft
  expandSmallLeft: function() {
  }, //Outline.expandSmallLeft
  toggleGraphics: function(force) {
    if(SDM.outlineImgFence==false) return;
    
    if(typeof(force)!=undefined) {
      if(force=="hide") {
        SDM.outlineGraphics=true;
      }
      else if(force=="show") {
        SDM.outlineGraphics=false;
      }
      else {}
    }
    
    if(SDM.outlineGraphics == true) {
      SDM.outlineGraphics = false;
      var ulWidthBefore = $('#outline ul').width();
      $('li div.fig, li div.tbl, li div.mmc').parent().hide();
      var ulWidthAfter = $('#outline ul').width();
      if(ulWidthAfter > ulWidthBefore && !SDU.isIE7()) {
        if(!$('#srcOutline').is(':visible') && !SDM.isMRWMODArticle)$('#outline').css('overflow-x', 'hidden');
        $('#outline').attr('data-osbp', 'n');
      }
      else if(ulWidthAfter < ulWidthBefore && !SDU.isIE7()) {
        $('#outline').attr('data-osbp', 'y');
      }
    }
    else {
      SDM.outlineGraphics = true;
      var ulWidthBefore = $('#outline ul').width();
      $('li div.fig, li div.tbl, li div.mmc').parent().show();
      var ulWidthAfter = $('#outline ul').width();
      if(ulWidthAfter > ulWidthBefore && !SDU.isIE7()) {
        $('#outline').attr('data-osbp', 'n');
      }
      else if(ulWidthAfter < ulWidthBefore && !SDU.isIE7()) {
        $('#outline').css('overflow-x', 'auto');
        $('#outline').attr('data-osbp', 'y');
      }
    }
  }, //Outline.toggleGraphics
  hoverOverOn: function() {
    this.onHover = true;
    var ol = $('#outline');
    ol.doTheScrollJitter();
        
    var ulWidthBefore = $('#outline ul').width();

    if(SDU.isIE7()) {}
    else {
      //ol.css('overflow-x', 'auto');
    }
        
    ol.css('overflow-y', 'auto');
    if(ol.attr('data-st')==undefined|| ol.attr('data-st')==0) {}
    else {
      ol.scrollTop(ol.attr('data-st'));
    }
        
    var ulWidthAfter = $('#outline ul').width();
    if(ulWidthAfter < ulWidthBefore) {
      ol.attr('data-osbp', 'y');
      if(SDU.isIE7()) {}
      else {
        if($('#lpTabs .leftTab').hasClass('activeTab')) {
          ol.find('.srcli').each(function() {
            if($(this).children('div.activeChapter').length) {
              $(this).children('div.activeChapter').children('span').css('margin-right', 0);
              $(this).find('li').css('margin-right', 0);
            }
            else {
              $(this).css('margin-right', 0);
            }
          });
        }
        else {
          ol.find('li').css('margin-right', 0);
        }
      }
    }
    else {
      ol.attr('data-osbp', 'n');
      if(SDU.isIE7()) {}
      else {
        ol.find('li').not('.outlineFocus').css('margin-right', 0);
      }
      ol.find('li.outlineFocus').parent().css('background', '#ffffff');
    }
    ol.css('background', '#ffffff');
    ol.children('ul').css('background', '#ffffff');
    ol.addClass('active');
        
    $('#articleLeftAd').css('background', '#ffffff');
    if( $("#articleLeftAd iframe").length > 0 ){
      $('#articleLeftAd iframe').contents().find('body').css('background', '#ffffff');
      $('#articleLeftAd iframe').css('background', '#ffffff');
    }
  },
  hoverOverOff: function() {
    this.onHover = false;
    var ol = $('#outline');
    ol.doTheScrollJitter()
    var ulWidthBefore = $('#outline ul').width();

    var st = ol.scrollTop();
    ol.attr('data-st', st);
    ol.css('overflow-y', 'hidden');
    if(!$('#srcOutline').is(':visible') && !SDM.isMRWMODArticle)ol.css('overflow-x', 'hidden');
    var ulWidthAfter = $('#outline ul').width();

    if(SDU.isIE7()) {
      if(ulWidthAfter < ulWidthBefore) {}
      else {
        if($('#lpTabs .leftTab').hasClass('activeTab')) {
          $('#outline > ul > li').css('margin-right', 0);
          ol.find('li.srcli').css('margin-right', $.scrollBarWidth());
        }
        else {
          $('#outline > ul > li').css('margin-right', $.scrollBarWidth());
        }
      }
    }
    else {
      if(ulWidthAfter < ulWidthBefore) {
        $('#outline > ul > li').css('margin-right', $.scrollBarWidth());
        ol.find('li.srcli').css('margin-right', $.scrollBarWidth());
      }
      else {
        ol.find('#itemOutline > li').each(function() {
            if($(this).children('div.activeChapter').length) {
              $(this).children('div.activeChapter').children('span').css('margin-right', $.scrollBarWidth());
              $(this).find('li').css('margin-right', 0);
            }
            else {
              $(this).css('margin-right', $.scrollBarWidth());
            }
        });
      }
    }
    ol.find('li.outlineFocus').parent().css('background', '#ecf2f6');
    ol.css('background', '#ecf2f6');
    ol.children('ul').css('background', '#ecf2f6');

    ol.removeClass('active');
    //This must be at end or FF will reset the scroll
    ol.scrollTop(st);
        
    $('#articleLeftAd').css('background', '#ecf2f6');
    if( $("#articleLeftAd iframe").length > 0 ) {
      $('#articleLeftAd iframe').contents().find('body').css('background', '#ecf2f6');
      $('#articleLeftAd iframe').css('background', '#ecf2f6');
    }      
  },
  moveToSection: function(e) {
     var selID=$(e.target).closest('a').attr('href').split('#');
     selID=selID[1];
     $('#centerPane').moveTo(selID);
     e.preventDefault();
     e.stopPropagation(); 

  },
  findTargetFragment: function(e) {

    var selID = e;
    if(typeof e != 'string') {
      var selID=$(e.target).closest('a').attr('href').split('#');
      selID=selID[1];
    }

    var id = selID;   
    id = id.replace(/[\.]/g, '\\.');
    id = id.replace(/[\:]/g, '\\:'); 

    var obj = $('#'+id); 

    if (!$(obj)[0]) {
       // Fragment not loaded yet.
       if (Fragment.crossRefMap) {
          var targetFrag = Fragment.getIntraRefFragId (selID);
          var targetFragNum = targetFrag.substr(targetFrag.indexOf('_')+1)*1;
          Fragment.get ('frag_' + (targetFragNum-1), e.data.z);
          Fragment.get (targetFrag, e.data.z, {successCb: function(ee) {Outline.findTargetFragment(ee)},
                                               successCbArg: e,
                                               failureCb: function(selId) {
                                                 Fragment.bail(300, 'fndtgt', selId);
                                               },
                                               failureCbArg: selID
                                              });
          Fragment.get ('frag_' + (targetFragNum+1), e.data.z);
        }
    } else {
      $('.page_fragment').show();
      Fragment.scrollFlag = false;
      $('#centerPane').moveTo(selID, { cbFunc: function() {Fragment.scrollFlag=true;}});
    } 

    if(typeof e != 'string') {
      e.preventDefault();
      e.stopPropagation();
    }
  },
  getJson: function() {
    $.get(SDM.urlPrefix + "/outlineJson/" + SDM.pm.pii + "/" + SDM.pm.cid, function(jsonStr, b, c) {
      SDM.tocJson = String(jsonStr);
    }, 'text')
    .error (function() {
      DBG.out (1, "Returned Error");
    });
  },
  showLeftAd:function() {
    if(SDM.adPreventOutline == true) return;
    if ( typeof SDM.adArticleLeftURL!='undefined') {
       $("#articleLeftAd").append('<iframe scrolling="no" frameborder="0" border="0" cellspacing="0" src="' + SDM.adArticleLeftURL + '"></iframe>');
    }
  } 
} //Outline



var DBG = {
  out: function(lvl, str) {
    if(SDM.debugFlag=="undefined") {return;}
    if(SDM.debugFlag >= lvl || lvl==0 || typeof ut == 'object') {
      if(typeof console=== "undefined" || typeof console.log==="undefined") {
//        if(!$('#sdConsole').length) {
//          $('body').append('<textarea id="sdConsole" class="ui-widget-content" cols="60"></textarea>');
//          $('#sdConsole').resizable();
//        }
//        $('#sdConsole').append(str + "<br>");
      }
      else{console.log(str) }
    }
  }
} //DBG

$(document).ready(function() {
    if (SDM.pru!='') {
      SD_UTIL.sendPageLoadStats();
    }
    if(!SDM.blk_all_social_logins  && SDU.cookieAvail()){
        LazyLoad.js([SDM.ep.gigyaLib], function() {
        $('.socialContainer').each(function(){
            if($(this).attr('id')!=''){
                loadSocialLoginOptions($(this).attr('id'));
            }
        });
        initGigyaHelp();
        });
    }
    if(SDU.isIE7())$('#ieWarningMsg').ieWarning();
        //loadBreadCrumbs();
});
function initGigyaHelp()
{
    $('#socialHelpPage').click(function(e){
        e.stopPropagation();
        e.preventDefault();
        openPopup($(this).attr('href'),'help',800,600);
    });
}
var SD_UTIL = {
  killEvent:function(e){
    if(!e) return;
    e.preventDefault()
    e.stopPropagation();
  },
  sendUserKeyEvent: function(a, o, z, ocf) {
    $.get(SDM.userActionURL+'/'+o+'/'+z+'/'+ocf+'/'+a);
  },
  sendUserKeyEventForPPV: function(a, o, z) {
     $.get(SDM.userActionURL+'/'+o+'/'+z+'/'+a);
  },
  sendDownloadKeyEvent: function(o, z, ocf, f) {
    $.get(SDM.ep.downloadActionURL+'/'+o+'/'+z+'/'+ocf+'/'+f);
  },
  loadLib: function(urlStr) {
    var headID = document.getElementsByTagName('head')[0];
    var newScript = document.createElement('script');
    newScript.type = 'text/javascript';
    newScript.src = urlStr;
    headID.appendChild(newScript);
  },
  isPerfTimingAvail:function() {
    return !(typeof window.performance==="undefined" || typeof window.performance.timing==="undefined")
  },
  isSendStatsReady:function() {
    if(SD_UTIL.isPerfTimingAvail()) {
      if(window.performance.timing.domComplete&&window.performance.timing.loadEventStart&&window.performance.timing.loadEventEnd) return true;
      else return false;
    }
    return true;
  },
  sendStats:function(){
    if(SD_UTIL.isSendStatsReady()) {}
    else {setTimeout(SD_UTIL.sendStats, 250);return;}
    var params = '';
    if(SD_UTIL.isPerfTimingAvail()) {
      for(var k in window.performance.timing) {
        prs.rt(("wpt_"+k), window.performance.timing[k]);
      }
    }
    var prs2 = _.sortBy(prs, function(val) {
      return val.toString().match(/([A-Za-z_]+:[A-Za-z0-9_]+)/g)[1].split(':')[1]*1.0;
    });
    for( var i = 0;i < prs2.length;i++){
      params += "data=" + prs2[i].toString() + "&";
    }
    params += "key=" + SDM.pageTransKey + "&";
    params += "pagetype=" + SDM.pageType;
  },
  printStats:function() {
    var newprs = _.sortBy(prs, function(val) {
      return val.toString().match(/([A-Za-z_]+:[A-Za-z0-9_]+)/g)[1].split(':')[1];
    });
    for( var i = 0;i < newprs.length;i++){
      var dParts = newprs[i].toString().match(/([A-Za-z_]+:[A-Za-z0-9_]+)/g);
      DBG.out(1, dParts[1].split(':')[1] + ',' + dParts[0].split(':')[1] + ',');
    }
  },
  sendPageLoadStats:function() {
    var params = '';
    if (window.performance && window.performance.timing) {
      if (window.performance.timing.loadEventEnd > 0) {
        params = SD_UTIL.getArtSpdStats();
        for(var k in window.performance.timing) {
          params += "&" + k + "=" + window.performance.timing[k];
        }
        var url = SDM.pru+"/pageReport?"+params;
        $('body').append('<img style="display:none" src="' + url + '">');
      }
      else {
        setTimeout(SD_UTIL.sendPageLoadStats, 100);
      }
    }
    else {
      params = SD_UTIL.getArtSpdStats();
      params += "&loadEventEnd=" + new Date().getTime();
      var url = SDM.pru+"/pageReport?"+params;
      $('body').append('<img style="display:none" src="' + url + '">');
    }
  },
  getArtSpdStats:function(){
      var params,lbl,timer;
      params = "cpc=SD";
      for( var i = 0;i < prs.length;i++){
        lbl=prs[i].toString().match(/([A-Za-z_]+:[A-Za-z0-9_]+)/g)[0].split(':')[1];
        if (lbl.indexOf("wpt_") == -1) {
          timer=prs[i].toString().match(/([A-Za-z_]+:[A-Za-z0-9_]+)/g)[1].split(':')[1];
          params += "&" + lbl + "=" + timer;
        }
      }
      params += "&key=" + encodeURIComponent(SDM.pageTransKey);
      params += "&pagetype=" + SDM.pageType;
      params += "&sds=" + SDM.sds;
      params += "&tid=" + SDM.tid;
      if(SDM.tm.ahm != undefined)params += "&ahm=" + SDM.tm.ahm;
      if(SDM.tm.chm != undefined)params += "&chm=" + SDM.tm.chm;
      if (document.location.href) {
        params += "&href=" + encodeURIComponent(document.location.href);
      }
      if (document.documentElement.clientWidth &&
          document.documentElement.clientHeight) { 
        params += "&winHeight=" + document.documentElement.clientHeight;
        params += "&winWidth=" + document.documentElement.clientWidth;
      }
      params += "&domCount=" + document.getElementsByTagName("*").length;
      return params;
  },
  getProdColor: function(){
    return (SDM.prodColor==""?"sci_dir":SDM.prodColor);
  },
  getIFrameHeight: function(ifr) {
    var ifrDoc=ifr.contentWindow||ifr.contentDocument||ifr.document;
    if(ifrDoc.document!=undefined) ifrDoc=ifrDoc.document;
    return $(ifrDoc.body).height();
  },
  resizeIFrame: function(iframeBox, iframeHeight) {
    $('#' + iframeBox + ' iframe').height(iframeHeight);
  }
}
// Lazy Loader
$.fn.lazyLoadImages = function(opts) {
  var cfg = {
    imgSel: 'img',
    preLoadLine: 10
  };
  var lastScrollTop=0;
  function scrollAction() {
    var bottom = $(window).height() + $('#centerPane').scrollTop();
    var totalCount=$(cfg.imgSel).size();
    var loopBool = true;
    var st=$('#centerPane').scrollTop();
    if (st > lastScrollTop){
       var scrollDown=true;
    } else {
       var scrollUp=true;
    }
    for(i=0;i<totalCount && loopBool==true ;i++){
      var obj = $(cfg.imgSel)[i];
      if( Math.abs($('#centerPane').scrollTop()+$(window).height() - $(obj).positionA('#centerContent').top+$(obj).height()) < 
                                                                     $(window).height() + cfg.preLoadLine
       || Math.abs($('#centerPane').scrollTop() - $(obj).positionA('#centerContent').top)  < $(window).height() + cfg.preLoadLine) {
        var imgObj = $(obj);
        if(imgObj.attr('data-loaded')!='true' ) {
          var dataGabsImgEID = imgObj.attr('data-gabsEID');
          var dataFullImgEID = imgObj.attr('data-fullEID');
          var dataThumbImgEID = imgObj.attr('data-thumbEID');
          var dataInlImgEid = imgObj.attr('data-inlimgeid');
          var dataInlImg = imgObj.attr('data-inlimg');
          var dataPubLogo = imgObj.attr('data-publogo');
          var dataDefaultLogo = imgObj.attr('data-defaultlogo');

          if (dataGabsImgEID != undefined && dataGabsImgEID != '' && SDM.entitled) {
              imgObj.attr('src', SDM.imageUrlPrefix + imgObj.attr('data-gabsEID')).attr('data-loaded', 'true');
          }else if (SDM.fullSize==true && dataFullImgEID != undefined && dataFullImgEID != '') {
              if(SDM.entitled)  {
                imgObj.attr('src', SDM.imageUrlPrefix + imgObj.attr('data-fullEID')).attr('data-loaded', 'true');
                if(imgObj.attr('data-fullwidth')<580 || imgObj.attr('data-fullwidth')>800){
                     $(obj).css('height', $(obj).attr('data-fullheight')).css('width', $(obj).attr('data-fullwidth'));
                } 
              } else {
                imgObj.attr('src', SDM.imageUrlPrefix + imgObj.attr('data-thumbEID')).attr('data-loaded', 'true'); 
              }
          } else if (dataThumbImgEID != undefined && dataThumbImgEID != '') {
            imgObj.attr('src', SDM.imageUrlPrefix + imgObj.attr('data-thumbEID')).attr('data-loaded', 'true');
            $(obj).css('height', $(obj).attr('data-thumbheight')).css('width', $(obj).attr('data-thumbwidth'));
          } else if (dataInlImgEid != undefined && dataInlImgEid != '') {
            imgObj.attr('src', SDM.imageUrlPrefix + imgObj.attr('data-inlimgeid')).attr('data-loaded', 'true');
	    if(imgObj.closest('.formula')[0] && imgObj.width()>=595){
	       imgObj.closest('.formula').find('.mathmlsrc').addClass('scrollOn');
            }
          } else if (dataDefaultLogo != undefined && dataDefaultLogo != '') {
            imgObj.attr('src', SDM.staticImageUrlPrefix + imgObj.attr('data-defaultlogo')).attr('data-loaded', 'true');
          } else if (dataPubLogo != undefined && dataPubLogo != '') {
            imgObj.attr('src', SDM.imageUrlPrefix + imgObj.attr('data-publogo')).attr('data-loaded', 'true');
          } else if (dataInlImg != undefined && dataInlImg != '') {
            imgObj.attr('src', SDM.staticImageUrlPrefix + imgObj.attr('data-inlimg')).attr('data-loaded', 'true');
          }
        }
      }
      else {
          if($('#centerPane').scrollTop()+$(window).height() - $(obj).positionA('#centerContent').top+$(obj).height() < 
             $(window).height() + cfg.preLoadLine && scrollDown){ 
	      loopBool=false;
          }
          if($('#centerPane').scrollTop() - $(obj).positionA('#centerContent').top  <  $(window).height() + cfg.preLoadLine && scrollUp){
              loopBool=false;
          }
      }
    }
    lastScrollTop=$('#centerPane').scrollTop();
  } //scroll

  return this.each(function() {
    if(opts) {
      $.extend(cfg, opts);
    }

    scrollAction(); // run it once for any images that are currently on the screen
    var lazyScroll = _.debounce(scrollAction, 300);
    $(this).scroll( lazyScroll );
  }) //return
};

$.fn.lazyLoadOutlineImages = function(opts) {
  var cfg = {
    imgSel: 'img',
    preLoadLine: 200
  };

  function lazyDisplay() {
    var cnt = 0;
    var myTop = 0;
    var myHeight = 0;
    var myWidth = 0;
    var thumbHeight = 0;
    $(cfg.imgSel).each(function() {
        var outlineTop = Math.abs($('#outline').scrollTop());
        var outlineBottom = Math.abs(outlineTop + $('#outline').height());
        var outlineHeight = $('#outline').height();
        var windowHeight = Math.abs($(window).height());
        if (cnt == 0) {
          myTop = Math.abs($(this).position().top);
        }
        else {
          myTop += (myHeight * 1); // add last height to position
        }
        myHeight = Math.abs($(this).height());
        thumbHeight = $(this).attr('data-thumbheight');
        if (thumbHeight == undefined) {
            thumbHeight = 0;
        }
        if (thumbHeight > 0 && thumbHeight < myHeight) {
            myHeight = thumbHeight;
        }
        myWidth = Math.abs($(this).width());
        var myDims = myTop * 1 + myHeight * 1;

        if( Math.abs(myDims - outlineTop) < Math.abs(outlineBottom + cfg.preLoadLine) 
         || Math.abs(outlineTop - myTop)  < Math.abs(outlineHeight + cfg.preLoadLine)) {
          var imgObj = $(this);
          if(imgObj.attr('data-loaded')!='true' ) {
            if (imgObj.attr('data-smlsrc') != undefined) {
               imgObj.attr('src', imgObj.attr('data-smlsrc')).attr('data-loaded', 'true');
            } else if (imgObj.attr('data-mmlEID') != undefined) {
               imgObj.attr('src', SDM.imageUrlPrefix + imgObj.attr('data-mmlEID')).attr('data-loaded', 'true');
            } 
            imgObj.addClass("displayImg");
          } 
          $(this).parent().parent().css('height', '').css('width', '');
        } 
        cnt++;
    })
  } //scroll

  return this.each(function() {
    if(opts) {
      $.extend(cfg, opts);
    }
      
    lazyDisplay(); // run it once to show images that are currently on page
    var lazyScroll = _.debounce(lazyDisplay, 300);
    $(this).scroll( lazyScroll );
  }) //return
};

$.fn.lazyLoad = function( cfg ){
  // Internal function used to implement `_.throttle` and `_.debounce`.
  var limit = function(func, wait, debounce) {
    var timeout;
    return function() {
      var context = this, args = arguments;
      var throttler = function() {
          timeout = null;
          func.apply(context, args);
      };
      if (debounce) clearTimeout(timeout);
      if (debounce || !timeout) timeout = setTimeout(throttler, wait);
    };
  };
  var plugin = {
    buffer: cfg.buffer?cfg.buffer:50, // 50 pixels by default
    batchSize: cfg.batchSize?cfg.batchSize:1, // 1 is the default batch size.
    scrollSrc: cfg.scrollSrc?cfg.scrollSrc:'#centerPane',
    callback: cfg.intoView?cfg.intoView:function(obj,idx){},
    selector: '.refPlaceHolder',
    screenTop: $(window).scrollTop(),
    screenHeight:$(window).height(),
    debounce: function(func, wait) {
      return limit(func, wait, true);
    },
    calculateView: function() {
      //pagination get all needs this
      if(refResolveEnabled==false) {return;}
      
      if( plugin.applyPatch() ) {
        plugin.buffer += 500;
        plugin.screenTop = $( plugin.scrollSrc ).scrollTop() - plugin.buffer;
      }
      else{
        plugin.screenTop = $( plugin.scrollSrc ).scrollTop() - plugin.buffer;
      }
      var screenBot = plugin.screenTop + $(window).height() + plugin.buffer;
      var batch = [];

      $refs = $(plugin.selector).not(function() {
        return $(this).attr('data-sr')=='Y';
      });
      $refs.each(function() {
        var tmpTop = $(this).position().top;
        if( plugin.applyPatch() ) {
          tmpTop = this.offsetTop;
        }

          if( tmpTop > plugin.screenTop && tmpTop < screenBot ) {                        
          $(this).attr('data-sr', 'Y');                    
            batch.push( this );            
            if( plugin.batchSize == 1 ){            
              plugin.callback( batch );
              batch = [];
            }
            else{              
              if( batch.length == plugin.batchSize ){
                plugin.callback( batch );
                batch = [];
              }
            }
          }
          else {
          $(this).attr('data-sr', 'N');                    
          }          
      });       
      if( batch ){ plugin.callback( batch ); } // run any remainder in batch
    },
    applyPatch:function() {
      return ($.browser.msie && $.browser.version < 9)
    }
  }

  var lazyResize = plugin.debounce(plugin.calculateView,300);
  var lazyScroll = plugin.debounce(plugin.calculateView, 300);
    
  $(window).resize( lazyResize );
  $(plugin.scrollSrc).scroll( lazyScroll );
  plugin.calculateView();
  return plugin;
}  
// end of Lazy Loader

// small enhancement
// this method will be called by gadget services to get
// encrypted cookie from web
function getEuid() {
      return SDM.euidCookieObject; 
}

function isNotNumber(o) {
  if (o == -1) {
    return true;
  }
  return isNaN (o-0);
}
function getNumber(str) {
  if(!str) {
    return -1;
  }
  var i=0;
  while(i < str.length) {
    var charat = str.charAt(i);
    if(!isNotNumber(charat)) {
      if(charat != "0") {
        return str.substring(i);
      }
    }
    i++;
  }
}
//Reference resolution
var ajaxRefResol;
var ajaxCitedByUpdate;
function updateCitedByCounts(citedByCounts,isHoover,start,count) {
  citedByCounts = citedByCounts.substring(0,citedByCounts.length-1);
  var updateCitedUrl = SDM.ep.updatedCitedBy + citedByCounts;

  ajaxCitedByUpdate = new $.ajax({
       url: updateCitedUrl,
       type: 'GET',
       async : isHoover,
       dataType : 'text',
       error: function() {
          $(".citedBy_").each(function(){
             $(this).html("");
          });
       },
       success: function(res) {
         var citedBy = decodeURIComponent(res);
         if (citedBy != null) {
            this.$citedByDiv = $('<div></div>')
              .hide()
              .append($(citedBy)
           );
           $(".citedBy_").each(function(){
              if(myXabsCounts[this.id]) {
                 if( this.innerHTML.match('Cited By in Scopus') == null) {
                  $(this).html( myXabsCounts[this.id]);
                  $(this).attr ("data-citeres", "Y");
                 }
              } else {
                 $(this).html("");
                 $(this).attr ("data-citeres", "Y");
              }
           });
         }
       }
   }); 
}
String.prototype.substringBetween = function (string1, string2) {
    if ((this.indexOf(string1, 0) == -1) || (this.indexOf(string2, this.indexOf(string1, 0)) == -1)) {
        return (-1);
    } else {
        return this.substring((this.indexOf(string1, 0) + string1.length), (this.indexOf(string2, this.indexOf(string1, 0))));
    }
};

var lazyRefs = null;
function refResolve() {
  lazyRefs = $(".refPlaceHolder").lazyLoad({
      batchSize:50,
      intoView:function(objs,idx){
          if( objs ){
            if( objs[0] ){
              var start = $(objs[0]).attr("id").substring(8);
              if(!start) {
                start = 1;
              }
              var count = objs.length;
              if (idx) {
                resolveRefs(idx,1);
              }
              else {
                resolveRefs( start, count );
              }
            }
          }
      }
  });
}


function resolveRefs( start, count ){
  var url = SDM.ep.refResolvePath + "&_refRangeStart="+start+"&_refRangeCount="+count;
  var isHoover = true;
  if (count == 1) {
    isHoover = false;
  }
  ajaxRefResol = new $.ajax({
      url: url,
      type: 'GET',
      async : isHoover,
      dataType : 'text',
      error: function() {
        $(".refPlaceHolder").each(function(){
            $(this).html(' <span style="color:red;"> [SD-008]<\/span>');
        });
        return;
      },
      success: function(res) {
        var refMap = decodeURIComponent(res);
        var citedBySCEids = refMap.substringBetween("#","^");
        var tmp = "#"+citedBySCEids+"^";
        refMap = refMap.replace(tmp,"");
        if (refMap != null) {
          this.$OuterDiv = $('<div></div>').hide().append($(refMap));
          $(".refPlaceHolder").each(function(){
              if (myMap[this.id.toLowerCase()]['refHtml'] || myMap[this.id.toLowerCase()]['refHtml'] != "") {
                if(this.innerHTML.match('/science?') == null){
                  $(this).html(myMap[this.id.toLowerCase()]['refHtml'] );
                  $(this).attr ("data-refres", "Y");
                }

                // Add abstarct url to the <li> tag
                if (myMap[this.id.toLowerCase()]['absUrl']) {
                  $(this).attr ("data-absurl", myMap[this.id.toLowerCase()]['absUrl']);
                }
              }
              else {
                $(this).html("");
                $(this).attr ("data-refres", "Y");
              }
          });

          // update Cited by counts
          if(citedBySCEids != null && citedBySCEids != ""){
            updateCitedByCounts(citedBySCEids,isHoover,start,count);
          }
        }
      }
  });     
}
//Reference resolution End
var EbookTOC = {
  eBookTOCTimeout: 1000,
  currentLink: null,
  tocObj: null,

  init: function() {
    var eBookTOCURL = $('div.publicationHead div.title a').attr("href").replace('book', 'toc');
    
    if(SDU.cookieAvail()&&SDU.sessionStorageAvail()) {
      var tocStr = sessionStorage.getItem('bk.toc');
      if(tocStr) {
        EbookTOC.tocObj = $.parseJSON(tocStr);
        if(EbookTOC.tocObj.eBookCID==SDM.pm.cid) {
          DBG.out(1, 'Found bk.toc using...');
        }
        else {
          EbookTOC.tocObj=null;
          sessionStorage.removeItem('bk.toc');
          DBG.out(1, 'Found different bk.toc removing...');
        }
      }
    }
    
    if(EbookTOC.tocObj==null) {
      $.getJSON(eBookTOCURL, function(res) {
        if (res){
          if(SDU.cookieAvail()&&SDU.sessionStorageAvail()&&typeof JSON!='undefined') {
            sessionStorage.setItem('bk.toc', JSON.stringify(res));
            DBG.out(1, 'Storing bk.toc');
          }
        }
        EbookTOC.load(res);
      });
    }
    else {
      EbookTOC.load(EbookTOC.tocObj);
    }
    $('#leftPane #srcOutline li div.so a').ellipsis();
  }, //init

  load:function(res) {
    var $bookToc = EbookTOC.buildToc(res);

    $('#leftPane').prepend('<ul id="lpTabs">'
      + '<li class="leftTab tab" tabindex="0">Book contents</li>'
      + '<li class="rightTab tab" tabindex="0">Chapter contents</li>'
      + '</ul>');
    $('#lpTabs .leftTab').click(function() {
        if($('#srcOutline').css('display')!='none') return;
        EbookTOC.showSourceTab(this);
        SD_UTIL.sendUserKeyEvent('sourceTabSelected', 'article', 'leftPane', SDM.keOriginContentFamily);
    });
    $('#lpTabs .rightTab').click(function() {
        if($('#srcOutline').css('display')=='none') return;
        EbookTOC.showItemTab(this);
        SD_UTIL.sendUserKeyEvent('itemTabSelected', 'article', 'leftPane', SDM.keOriginContentFamily);
    });
    $('#outline').prepend($bookToc);
    $('#outline, #leftPane, #leftPaneInner').addClass('book');

    //Initially set all parent nodes to collapsed.
    EbookTOC.showPath2Item(SDM.pm.pii);
    $('.activeChapter >a').attr('href', "");

    if(SDM.outlineTab=='I') {
      EbookTOC.showItemTab($('#lpTabs .rightTab')[0]);
    }
    else {
      EbookTOC.showSourceTab($('#lpTabs .leftTab')[0]);
      $('#outline').scrollToTopic({selTopic:'div.activeChapter'}); 
    }
    $('.leftPaneToggle').unbind('click').bind('click',function(e){
    e.preventDefault();
    e.stopPropagation();
    EbookTOC.nodeClick($(this)[0]);
    });
  }, //load
  showSourceTab:function(e) {
    $(e).parent().children('.tab').removeClass('activeTab');
    $(e).addClass('activeTab');
    $('.outlineMsg').hide();
    $('#srcOutline').show();
    $('.activeChapter').parent().append($('#itemOutline')[0]);
    $('#itemOutline').css('background','');
    $('#searchWithin').show();
    $('#olGraphCbBox').hide();
    Outline.toggleGraphics('hide');
    $('#outline > ul,#articleLeftAd').css('width', $('#outline').width()-$.scrollBarWidth());
    $('#outline.js').css('top', '44px');
    $('#outline').scrollToTopic({selTopic:'div.activeChapter'});
  },
  showItemTab:function(e) {
    $(e).parent().children('.tab').removeClass('activeTab');
    $(e).addClass('activeTab');
    $('#outline').removeClass('bookError').prepend($('#itemOutline')[0]);
    $('#searchWithin .errorMsg').remove();
    $('.outlineMsg').show();
    $('#srcOutline').hide();
    $('#searchWithin').hide();
    $('#olGraphCbBox').show();
    if($('#outlineGraphicsCheckBox').prop('checked')==true) {
     Outline.toggleGraphics('show');
     $('#outline > ul,#articleLeftAd').css('width', $('#outline').width()-$.scrollBarWidth());
    }
    $('#outline.js').css('top', '32px');
  },
  buildToc:function(res) {
    $('body').append('<ul id="srcOutline"></ul>');
    for(var i in res.eBookTOC) {
      $('#srcOutline').append(EbookTOC.buildTocNode(res.eBookTOC[i], 1));
    }
    return $('#srcOutline');
  },
  buildTocNode:function(nr, lvl) {
    var classStr = "so item " + nr.NodeType;
    var spClass = 'srcPartClosed';
    if(nr.NodeList) classStr += " parent ";
    if(nr.PII==SDM.pm.pii) {
      classStr += ' activeChapter ';
      spClass = 'srcPartOpened';
    }
    if(lvl>3) {
      lvl=3;
    }
    
    var $node;
    if(nr.PII) {
      $node = $('<li data-pii="' + nr.PII + '" class="srcli lvl' + lvl + '"></li>');
      if(nr.PII==SDM.pm.pii) {
        $node.append('<div class="' + classStr + '"><div class="' + 'srcPartStatic' + '"></div><span title="' + nr.Title + '">' + nr.Title + '</span></div>');
      }
      else {
        $node.append('<div class="' + classStr + '"><div class="' + 'srcPartStatic' + '"></div><a class="cLink" querystr="?&zone=leftPane&_origin=article&originContentFamily=nonserial" href="/science/article/pii/' + nr.PII + '" title="' + nr.Title + '">' + nr.Title + '</a></div>');
      }
    }
    else if(nr.NodeList && nr.NodeList.length) {
      $node = $('<li data-pii="" class="srcli lvl' + lvl + '"></li>');
      $node.append('<div class="' + classStr + '"><div class="srcPartClosed leftPaneToggle">&nbsp;</div><a class = "leftPaneToggle" href="" ' + '" title="' +nr.Title + '">' + nr.Title + '</a></div>');
      var $ul = $('<ul></ul>');
      for(var i in nr.NodeList) {
        $ul.append(EbookTOC.buildTocNode(nr.NodeList[i], lvl+1));
      }
      $node.append($ul);
      $ul.hide();
    }
    return $node;    
  },
  nodeClick:function(e) {
    if($(e).parent().parent().children('ul').css('display')=='none') {
      $(e).parent().parent().children('ul').show();
      $(e).parent().children('div').addClass('srcPartOpened').removeClass('srcPartClosed');
    }
    else {
      $(e).parent().parent().children('ul').hide();
      $(e).parent().children('div').removeClass('srcPartOpened').addClass('srcPartClosed');
    }
  },
  showPath2Item:function(pii) {
    $('#srcOutline li').each(function() {
      if($(this).attr('data-pii')==pii) {
        $(this).children('div').removeClass('so').addClass('socip');
        $(this).parentsUntil('#srcOutline').filter('li').each(function() {
            $(this).removeClass('srcli');
            EbookTOC.nodeClick($(this).children('div').children('a')[0]);
            $(this).children('div').removeClass('so').addClass('socip');
        });
      }
    });
  },
  getPath2Item:function(pii) {
    var rslt;
    $('#srcOutline li').each(function() {
      if($(this).attr('data-pii')==pii) {
        rslt = $(this).parentsUntil('#srcOutline').children('div');
      }
    });
    return rslt;
  }
} //EbookTOC

//Nonserial Index and glossary ajax call
var loadsection;
function loadSection(baseUrl,section) {
  if(Fragment.isAvail()) { loadSectionFrag(baseUrl,section);return;}
  var endPoint = baseUrl+section;
  var div1 = doc.getById("indexSection");
  loadsection = new $.ajax( {
      url: endPoint,
      type: 'GET',
      error: function() {     
        $('#centerInner').find ('.glossarySec,.artIndexItem').remove();
        $('#centerInner').find('h3').remove();
        var vpHeight = $(window).height();
        var d = ArticlePage.verticalStretcher($('#centerInner')[0].scrollHeight, vpHeight);
        
      },
      success: function(res) {
        $('#centerInner').find ('.glossarySec,.artIndexItem').remove();
        $('#centerInner').find('h3').remove();
        $('#centerInner').append(res);
        $('#centerInner').append($('#centerInner').find('.copyright').prev());
        $('#centerInner').append($('.copyright'));
        $('#centerInner').append($('#pStretcher'));
        if($('#'+section).position()!=null) {
          $('#centerPane').moveTo(section);
        }
        var secTitle=$('#sectitle');    
        $('#ol_sectitle').html("<a onclick=\"return $('#centerPane').moveTo('sectitle')\"  href='"+secTitle.attr('id')+"'>"+secTitle.html()+"<br></a>");
        var vpHeight = $(window).height();
        var d = ArticlePage.verticalStretcher($('#centerInner')[0].scrollHeight, vpHeight);
      }
  });
}

function loadSectionFrag(baseUrl,section) {
  var endPoint = baseUrl+section;
  var div1 = doc.getById("indexSection");
  $('#centerPane').unbind('scroll', Fragment.scroll);
  Fragment.isFooterEnabled = function() {return true; };
  loadsection = new $.ajax( {
      url: endPoint,
      type: 'GET',
      error: function() {     
        $('.page_fragment').find('.glossarySec,.artIndexItem').remove();
        $('.page_fragment').find('h3').remove();
        var vpHeight = $(window).height();
        var d = ArticlePage.verticalStretcher($('#centerInner')[0].scrollHeight, vpHeight);
      },
      success: function(res) {
        $('#centerPane .page_fragment').each(function() {
            if ($(this).attr("data-first") == "true") {
              $(this).find ('.glossarySec,.artIndexItem').remove();
              $(this).find('h3').remove();
              $(this).find('.copyright').remove();
              $('.page_fragment').append (res);
              var copyright = $('#centerInner').find('.hiddenCopyright');
              if ($(copyright)[0]) $('.page_fragment').append ('<p class="copyright">' +$(copyright).text() + '</p>');
            } else {
              $(this).remove();
            }
        });
        if($('#'+section).position()!=null) {
          $('#centerPane').moveTo(section);
        }
        var secTitle=$('#sectitle');    
        $('#ol_sectitle').html("<a onclick=\"return $('#centerPane').moveTo('sectitle')\"  href='"+secTitle.attr('id')+"'>"+secTitle.html()+"<br></a>");
        var vpHeight = $(window).height();
        var d = ArticlePage.verticalStretcher($('#centerInner')[0].scrollHeight, vpHeight);
      }
  });

}

//TOOL BAR
var AutoCompleFlag =false;
var IE7HeightFixGlobalVar;
var ArticleToolbar = {
  DEFAULT_QS_TEXT: "Search ScienceDirect",
  init:function() {
    $("#quickSearch").css("color", "#9b9b9b");
    $("#articleToolbar .sdSearch input").val("Search ScienceDirect");
    $("#quickSearchButton").click( ArticleToolbar.toggleQuickSearch );
    //the below code for ie7
    if( $("#sdQuickSearch").is(":visible") ){
      $("#centerPane").bind('click',ArticleToolbar.toggleQuickSearch);
    }
    $("#moreOptionsButton").click( ArticleToolbar.toggleOptions );
    $('#quickSearch').bind('keypress',ArticleToolbar.qssmall_frmsubmit);
    $('#articleToolbar .sdSearch button.submit').bind('click',ArticleToolbar.qSearchbut);
    $('#articleToolbar .sdSearch input').bind('focusin',ArticleToolbar.showTextQSonFocus);
    $('#articleToolbar .sdSearch input').bind('focusout',ArticleToolbar.showTextQSoutFocus);

    //make sure the icons for toolbar are clickable too         
    $('.icon_pdf div').click(function(){ $('.icon_pdf a').click();  })
    $('.icon_orderdoc'+SD_UTIL.getProdColor()+' div').click(function(){ 
        document.location = $(".icon_orderdoc"+SD_UTIL.getProdColor()+" a").attr("href");  });
    $('.icon_exportarticle'+SD_UTIL.getProdColor()+' div').click(function(){ 
        document.location = $(".icon_exportarticle"+SD_UTIL.getProdColor()+" a").attr("href"); })
    $('.email'+SD_UTIL.getProdColor()+' div').click(function(){
        document.location = $(".email"+SD_UTIL.getProdColor()+" a").attr("href"); });
    $('.alert'+SD_UTIL.getProdColor()+' div').click(function(){
        document.location = $(".alert"+SD_UTIL.getProdColor()+" a").attr("href"); });
    $('.thumbnail'+SD_UTIL.getProdColor()+' div').click(function(){
        document.location = $(".thumbnail"+SD_UTIL.getProdColor()+" a").attr("href"); });
    $('.fullsize'+SD_UTIL.getProdColor()+' div').click(function(){
        $(".fullsize"+SD_UTIL.getProdColor()+" a").click(); });
  },
  toggleQuickSearch:function(e){
    AutoCompleFlag =false;
    if( $("#sdQuickSearch").is(":visible") ){
      $("#quickSearchButton").attr("title", "Show more quick search options");
      $("#quickSearchButton div").removeClass("up_" + SD_UTIL.getProdColor() );
    }else{
      $("#quickSearchButton").attr("title", "Show less quick search options");
      $("#quickSearchButton div").addClass("up_" + SD_UTIL.getProdColor() );
    }

    $("#sdQuickSearch").toggle('blind',function(){
        if( $("#sdQuickSearch").is(":visible") ){
          ArticleToolbar.disableQS();
        }
        else{
          ArticleToolbar.enableQS(); 
        }                
    });

    $('body').bind('click',ArticleToolbar.closeQS);
    $('#centerPane').bind('scroll',ArticleToolbar.closeQS);
    ArticleToolbar.closeOptions();        
    SD_UTIL.killEvent( e );        
  },
  toggleOptions:function(e){
    AutoCompleFlag =true;
//    if ($(".svArticle").length == 0) {
//       $(".ereader").hide();
//    }

    if( $("#moreOptionsMenu").is(":visible") ){
      ArticleToolbar.closeOptions();
    }
    else{
      $("#moreOptionsButton div").addClass("up_" + SD_UTIL.getProdColor() );
      EReader.optionsOpened();
      if(SDU.isIE7() || SDM.adReqOptions==false) {
        $("#moreOptionsMenu").show('blind');
      }
      else {
        $("#moreOptionsMenu").show();
      }
      $('body').bind('click',ArticleToolbar.closeOptions);
      $('#centerPane').bind('scroll',ArticleToolbar.closeOptions);  
    }
    ArticleToolbar.closeQS();
    SD_UTIL.killEvent( e );
  },
  closeOptions:function(e){
    if(e==undefined){
       targetElm=true;
    }else{
       targetElm=(!$(e.target).parents('#alertOn,#alertOff,.thumbnailsci_dir')[0]);
    }
    
    //clear status of ereader links
    EReader.optionsClosed();
    
    if( $("#moreOptionsMenu").is(":visible") && targetElm){
    $("#moreOptionsButton div").removeClass( "up_" + SD_UTIL.getProdColor() );
      if(SDU.isIE7() || SDM.adReqOptions==false) {
        $("#moreOptionsMenu").hide('blind');
      }
      else {
        $("#moreOptionsMenu").hide();
      }
    $('body').unbind('click',ArticleToolbar.closeOptions );
    $('#centerPane').unbind('scroll',ArticleToolbar.closeOptions );                
    }
  },
  userIsUsingSearchForm:function(e) {
    var IE7HeightFixLocalVar = $("#page-area").height();
    if(IE7HeightFixLocalVar>0) {
      IE7HeightFixGlobalVar=IE7HeightFixLocalVar;
    }
    if(AutoCompleFlag!=true) {
      if($(e.target).attr("class")!="ui-corner-all") {
        return  e &&  ($( e.target ).parents( "div" ).hasClass("extSearch") ||
                       $( e.target ).parents( "div" ).hasClass("quickSearch") );
      }
      else{
        $("#page-area").height(IE7HeightFixGlobalVar+"px");
        return true;
      }
    }
    else{
      return  e && ($( e.target ).parents( "div" ).hasClass("extSearch") ||
                    $( e.target ).parents( "div" ).hasClass("quickSearch") );
    }
  },
  closeQS:function(e) {
    if( $("#sdQuickSearch").is(":visible") ) {
        $("#quickSearchButton").attr("title", "Show more quick search options");
    }
    if( ArticleToolbar.userIsUsingSearchForm( e )) { return; }
    $("#quickSearchButton div").removeClass( "up_" + SD_UTIL.getProdColor() );
    if( $("#sdQuickSearch").is(":visible") ){
        ArticleToolbar.enableQS(); 
        $("#sdQuickSearch").toggle('blind');
    }
    $('body').unbind('click',ArticleToolbar.closeQS );
    $('#centerPane').unbind('scroll',ArticleToolbar.closeQS );
  },
  disableQS:function(){
    $(".sdSearch input").prop("disabled","disabled");
    $(".sdSearch input").css("background","#CCCCCC");
    $(".sdSearch button").prop("disabled","disabled");        
    $(".sdSearch input").css("color","#9b9b9b");     
    if( ArticleToolbar.containsUserQuery() ){
      $("#qs_all").val($(".sdSearch input").val());
    }
  },
  enableQS:function(){
    $(".sdSearch input").prop("disabled","");
    $(".sdSearch input").css("background","white");
    if($("#qs_all").val() == "" || $("#qs_all").val() == "Search figures & videos"){
      $(".sdSearch input").css("color","#9b9b9b");
    }
    else{
      if ($("#Articles").prop("checked") == true){
        $(".sdSearch input").css("color","#000000");
      }
    }

    $(".sdSearch button").prop("disabled","");
    if ($("#Images").prop("checked") == false){ 
      $(".sdSearch input").val( $("#qs_all").val());
    }
    else if( $("#qs_all").val()!='' && $("#qs_all").val() != ArticleToolbar.DEFAULT_QS_TEXT ) {
      $(".sdSearch input").val( $("#qs_all").val() );
    }
    else if( $("#qs_all").val()=='' ){
      $(".sdSearch input").val(ArticleToolbar.DEFAULT_QS_TEXT);
    }
    $("#Articles").prop("checked", true);

    $(".toggleQukSrch").css('display', '');
    $("#fieldLabel").html("&nbsp;&nbsp;&nbsp;&nbsp;All Fields");
    $("#qs_all").attr("title","For Example. Heart Attack and Behaviour");
    if ($("#qs_all").val() == "Search figures & videos") {
        $("#qs_all").val('');
        $("#qs_all").css('color','#000000');
    }
    $("#volField, #qs_vol , #issueField , #qs_issue , #pageField , #qs_pages").css('display','');
    if (/MSIE (\d+\.\d+);/.test(navigator.userAgent)) {
      $("#submit_search").css('margin-left','14px');
    }

    $("#sdQuickSearch input.textbox").val("");
    ArticleToolbar.resetOnEmptyQS();
  },
  resetOnEmptyQS:function(){
    if ( $(".sdSearch input").val()=="" ){
         $(".sdSearch input").val(ArticleToolbar.DEFAULT_QS_TEXT);
    }
  },
  containsUserQuery:function(){
    return $(".sdSearch input").val() != ArticleToolbar.DEFAULT_QS_TEXT;
  },
  qSrchButton:function(){
    doc.getById("qs_all").value=doc.getById("quickSearch").value;
    document.forms["qkSrch"].submit();
    return false;
  },
  qssmall_frmsubmit:function(e){
    var code = (e.keyCode ? e.keyCode : e.which);
    if(code == 13) { 
      if($(".sdSearch input").val() == ArticleToolbar.DEFAULT_QS_TEXT){
        $(".sdSearch input").val("");
        ArticleToolbar.qSrchButton();
      }
      else{
        ArticleToolbar.qSrchButton();
      }
    }
  },
  qSearchbut:function(){
    if($(".sdSearch input").val() == ArticleToolbar.DEFAULT_QS_TEXT){
       $(".sdSearch input").val("");
      ArticleToolbar.qSrchButton();
    }
    else{
      ArticleToolbar.qSrchButton();
    }
  },
  artInternalLnkPos:function(){
    if($('#_loggedusr').val() == 'loggedusr') {
      $('#articleToolbar').css('height',52);
    }
    else {
      $('#articleToolbar').css('height',26);
    }
  },

  showTextQSonFocus:function(){
    if($("#quickSearch").val() == ArticleToolbar.DEFAULT_QS_TEXT){
      $("#quickSearch").val("");
      $("#quickSearch").css("color", "#000000");
      return false;
    }
    else{
      $("#quickSearch").css("color", "#000000");
    }
  },
  showTextQSoutFocus:function(){
    if($("#quickSearch").val() == ""){
      $("#quickSearch").val( ArticleToolbar.DEFAULT_QS_TEXT );
      $("#quickSearch").css("color", "#9b9b9b");
      return false;
    }
  }
};

var blocks = {
  articleOptions: false,
  quickSearch: false
};

function publicationLink(url, showId, hideId, rsltIndId) {
  $.get(url, function(data) {
      if(data.match(/TRUE/g)) {
        $('#'+hideId).css('display', 'none');
        $('#'+showId).css('display', 'inline');
        $('#'+rsltIndId).css('display', 'none');
      }
      else {
        $('#'+rsltIndId).css('display', 'inline');
      }
      setTimeout("ArticleToolbar.closeOptions('')",500);
  });
}
//TOOL BAR END

function openNS(url, width, height) {
  if ((navigator.appName == "Microsoft Internet Explorer") && (parseFloat(navigator.appVersion) < 4 )) {
    return false;
  }

  if (!width) var width = 600;
  if (!height) var height = 400;
  var newX=width,newY=height,xOffset=10,yOffset=10;
  var parms = 'width=' + newX + ',height=' + newY +
    ',screenX='+ xOffset + ',screenY=' + yOffset +
    ',status=yes,toolbar=yes,menubar=yes' +
    ',scrollbars=yes,resizable=yes,location=yes';
  nsWin = window.open(url,'displayWindow',parms);
  nsWin.focus();
  return false;
}

var figCaption;
function openStrippedNS(url, figElem, figRefElem, pii) {
  if ((navigator.appName == "Microsoft Internet Explorer") &&(parseFloat(navigator.appVersion) < 4 )) {
    return false;
  }
  var capId = figElem.replace('labelCaption','');
  var ih = doc.getById(figElem);
  var cRef = doc.getById(capId+'b'+figRefElem);
  var newRef = doc.getById('anc'+capId+'b'+figRefElem);

  var xOffset=25,yOffset=25;
  var parms = 'left='+ xOffset + ',top=' + yOffset +',status=yes,toolbar=no,menubar=no' + ',scrollbars=yes,resizable=yes,location=no';
  if(ih != null ) {
    if(cRef != null) {
      figCaption = ih.innerHTML.replace(cRef.innerHTML,'<a href='+'/science/article/pii/'+pii+'#'+figRefElem+'>'+newRef.innerHTML+'</a>');
    }
    else {
      figCaption = ih.innerHTML;
    }
  }
  else {
    figCaption = "";
  } 
  var focusCount=0;
  var nsWin = window.open(url,'displayWindow',parms);
  if(nsWin)nsWin.focus();
  $(window).unbind('focus').bind('focus',function(){
    if(nsWin && focusCount<=5){
       nsWin.focus();
       focusCount++;
    }else{
      focusCount=0;
      $(window).unbind('focus');
    }
  }); 
  window.setTimeout(function(){focusCount=10;},1000);
  return false;
}

var LoginBox = {
  getStyleObj: function(elem,parent) {
    if (document.layers) {
      if (parent) {return "document."+parent+".document."+elem;}
      else { return "document."+elem + ".style";}
    }
    else if (document.all) {return "document.all."+elem + ".style";}
    else if (document.getElementById) {return "doc.getById('"+elem+"').style";}
  },
  flipLogin: function (e,button){
    var t = eval(LoginBox.getStyleObj(e));
    var u = doc.getById("loginPlus");
    var v = doc.getById("userPlus");
    var userbox = doc.getById("userBox");
    var j = doc.getById("loginPlusScript");
    if(button == null){
      if (t.display=="none"){
        t.display = 'block';
        j.className = 'minus';
      }
      else{
        t.display = 'none';
        j.className = 'plus';
      }
    }
    else if (button == "userPlus" ) {
      if (t.display=="none" ){
        t.display = 'block';
        v.className = 'userMinus';
      }
      else{
        t.display = 'none';
        v.className = 'userPlus';
      }
    }
    else{
      if (t.display=="none" ){
        t.display = 'block';
        userbox.style.display ='none';
        v.className = 'userPlus';
      }
      else{
        t.display = 'none';
      }
    }
  }
}//LoginBox

/*Existing Quick Search functionality*/
//Auto complete in quicksearch
function sortInit() {
  var navBox = $("#navBox");
//  navBox.children().css("cursor", "move");
  navBox.sortable({ axis: "y",
                    opacity: 0.6
                 });
  navBox.disableSelection();
  navBox.bind("sortstop", function(event,ui) {
    var url = SD_SORTURL + "?" + navBox.sortable("serialize");
    $.get(url);
  });
}
///////////////////////////
var QuickSearch = {
  getElementsByClassName: function(oElm, strTagName, strClassName){
    var arrElements = (strTagName == "*" && oElm.all)? oElm.all : oElm.getElementsByTagName(strTagName);
    var arrReturnElements = new Array();
    strClassName = strClassName.replace(/\-/g, "\\-");
    var oRegExp = new RegExp("(^|\\s)" + strClassName + "(\\s|$)");
    var oElement;
    for(var i=0; i<arrElements.length; i++){
      oElement = arrElements[i];
      if(oRegExp.test(oElement.className)){
        arrReturnElements.push(oElement);
      }
    }
    return (arrReturnElements);
  }, //getElementsByClassName

  clearQSForm: function() {
    document.qkSrch.qs_tak.value="";
    document.qkSrch.qs_author.value="";
    document.qkSrch.qs_title.value="";
    document.qkSrch.qs_vol.value="";
    document.qkSrch.qs_issue.value="";
    document.qkSrch.qs_pages.value="";
  }, //clearQSForm

  changeFields: function(event) {
    var quckSrch = QuickSearch.getElementsByClassName(document, 'td', 'toggleQukSrch');
    if(event.currentTarget.value == "i") {
      $(".toggleQukSrch").css('display', 'none');
      doc.getById("fieldLabel").innerHTML = "&nbsp;&nbsp;&nbsp;&nbsp;Images";
      doc.getById("qs_all").title = "Search figures & videos";
      if (doc.getById("qs_all").value == "") {
        doc.getById("qs_all").value = "Search figures & videos";
        doc.getById("qs_all").style.color ="#9b9b9b";
      }
      doc.getById("volField").style.display = "none";
      doc.getById("qs_vol").style.display = "none";
      doc.getById("issueField").style.display = "none";
      doc.getById("qs_issue").style.display = "none";
      doc.getById("pageField").style.display = "none";
      doc.getById("qs_pages").style.display = "none";
      if (/MSIE (\d+\.\d+);/.test(navigator.userAgent)){
        doc.getById("submit_search").style.marginLeft = "7px";
      }
    }
    else {
      $(".toggleQukSrch").css('display', '');
      doc.getById("fieldLabel").innerHTML = "&nbsp;&nbsp;&nbsp;&nbsp;All Fields";
      doc.getById("qs_all").title = "For Example. Heart Attack and Behaviour";
      if (doc.getById("qs_all").value == "Search figures & videos") {
        doc.getById("qs_all").value = ""; 
        doc.getById("qs_all").style.color ="#000000";
      }
      doc.getById("volField").style.display = "";
      doc.getById("qs_vol").style.display = "";
      doc.getById("issueField").style.display = "";
      doc.getById("qs_issue").style.display = "";
      doc.getById("pageField").style.display = "";
      doc.getById("qs_pages").style.display = "";
      if (/MSIE (\d+\.\d+);/.test(navigator.userAgent)){
        doc.getById("submit_search").style.marginLeft = "14px";
      }
    }
  }, //changeFields
  clearValues: function() {
    if(doc.getById("Images").checked ==  true) {
      if(doc.getById("qs_all").value == "Search figures & videos") {
        doc.getById("qs_all").value = "";
        doc.getById("qs_all").style.color ="#000000";
      }
    }
  }, //clearValues
  setValues: function() {
    if (doc.getById("Images").checked ==  true) { 
      if (doc.getById("qs_all").value == "") {
        doc.getById("qs_all").value = "Search figures & videos";
        doc.getById("qs_all").style.color ="#9b9b9b";
      }
    }
  } //setValues
}; //QuickSearch



function autoCompleteInit() {
  $(document).ready(function() {sdAutoComplete('qs_title','qsPub_autoComp', SDM.urlPrefix + '/jfind/auto');});
}

function sdAutoComplete(inputField, outputField, serviceURL) {
  $(".qsRadio").click(QuickSearch.changeFields);
  $(".qsImgBlurFocus").blur(QuickSearch.setValues);
  $(".qsImgBlurFocus").focus(QuickSearch.clearValues);
  $( "#" + inputField ).autocomplete(
    { 
      minLength:2,
      source: function(req,resp) {
        $.post(serviceURL,{ qs_title:req.term }, function(data){
          var list = []
          $(data).find("li").each(function(i,e){ list.push({ label:$(e).text() });});
          resp( list );
        })
      },
      open: function(event, ui) { $("ul.ui-autocomplete").css("z-index", 1999); $("ul.ui-autocomplete").addClass("suggdropdown"); }
    });
}
              
function ccAutoComplete(inputField, outputField, validCostCodes) {
  $("#"+inputField).autocomplete({
    minLength:2,
    source:validCostCodes
  });
  //var costcode_list = new Autocompleter.Local(inputField,outputField,validCostCodes,{ minChars:2, partialSearch:false }) 
}
autoCompleteInit();

var CanonicalLink = {
  init: function() {
    $("body").delegate(".cLink", "click", function(event) {
      var t = $(this);
      createStateCookie(t.attr("queryStr"), event);
    });
  }
}

var CanonicalHomeLink = {
  init: function() {
    $("body").delegate(".canonHomeLink", "click", function(event) {
        var t = $(this);
        createCookieForHomePage(t,event);
    });
  }
}

function createCookieForHomePage (hc, e) {
  var cv = '';
  cv=cv.addTag(hc.attr("method"), 'md')
    .addTag(hc.attr("zone"), 'z')
    .addTag(hc.attr("btn"), 'btn')
    .addTag(hc.attr("origin"), 'org')
    .addTag(hc.attr("more"), 'me')
    .addTag(hc.attr("actionType"), 'at')
    .addTag(hc.attr("boxAction"), 'bt')
    .addTag(hc.attr("box"), 'bx')
    .addTag(hc.attr("record"), 'rd')
    .addTag(hc.attr("fl"), 'fl')
    .addTag(hc.attr("prompt"), 'pt')
    .addTag(hc.attr("lg"), 'lg');
  createCookie("SD_HOME_PAGE_COOKIE", cv)
}

String.prototype.getParameter = function(inName)
{
   var outParm = "";
   var queryIndex = this.indexOf("?");
   var parmIndex = this.indexOf(inName, queryIndex+1);
   if (parmIndex > 0)
   {
      parmIndex += inName.length;
      while ((parmIndex >= 0) && ('=' != this.charAt(parmIndex)))
      {
         parmIndex = this.indexOf(inName, parmIndex+1);
         if (parmIndex > 0)
         {
            parmIndex += inName.length;
         }
      }
      if ('=' == this.charAt(parmIndex))
      {
         parmIndex++;
         var endIndex = parmIndex;
         while (   (endIndex < this.length)
                && ('&' != this.charAt(endIndex))
                && ('#' != this.charAt(endIndex)))
         {
            endIndex++;
         }
         if (endIndex > parmIndex)
         {
            outParm = this.substring(parmIndex,endIndex);
         }
      }
   }
   return outParm;
}

String.prototype.addTag = function (tagVal, tag) {
  if(tagVal) {
    return this.concat("<"+tag+">"+tagVal+"</"+tag+">");
  }
  else {
    return this;  
  }
};

function createStateCookie (qs, e) {
  var zone='';
  zone = qs.getParameter("_zone");
  if(!zone) {
    zone = qs.getParameter("zone");
  } 
  var cv = '';
  if(zone == "subjectBrowse")
  {
  
     cv=cv.addTag(zone, 'z')
     .addTag(qs.getParameter("_origin"), 'org')
     createCookie ("MRW_MODULE_STATE_COOKIE", cv);
  }
  else{
      if (qs) {
         cv=cv.addTag(qs.getParameter("_alid"), 'al')
        .addTag(qs.getParameter("_rdoc"), 'rd')
        .addTag(qs.getParameter("_fmt"), 'fmt')
        .addTag(qs.getParameter("_origin"), 'org')
        .addTag(qs.getParameter("_srch"), 'src')
        .addTag(qs.getParameter("_ct"), 'cnt')
        .addTag(zone, 'z')
        .addTag(qs.getParameter("_docanchor"), 'av')
        .addTag(qs.getParameter("_alertKey"), 'ak')
        .addTag(qs.getParameter("_wid"), 'wid')
        .addTag(qs.getParameter("_errMsg"), 'err')
        .addTag(qs.getParameter("_reqId"), 'req')
        .addTag(qs.getParameter("_xRefDocId"), 'cid')
        .addTag(qs.getParameter("_origPii"), 'opi')
        .addTag(qs.getParameter("artImgPref"), 'rt')
        .addTag(qs.getParameter("_cid"), 'rwi')
        .addTag(qs.getParameter("_hierId"), 'rhi')
        .addTag(qs.getParameter("_explode"), 'exp')
        .addTag(qs.getParameter("_idxType"), 'ind')
        .addTag(qs.getParameter("_refLink"), 'rfl')
        .addTag(qs.getParameter("_alpha"), 'alp')
        .addTag(getDateTime(), 'rdt')
        .addTag(qs.getParameter("overrideIP"), 'oip')
        .addTag(qs.getParameter("nextPrevTag"), 'np')
        .addTag(qs.getParameter("originContentFamily"), 'oct')
        .addTag(qs.getParameter("panel"), 'p');
    }
        createCookie ("SD_ART_LINK_STATE", cv);
  }
}

  
function createCookie(cookieName, value) {
	var finalCookie;
    
    var cookieStart = "<e><q>science</q>";
    var cookieEnd = "<enc>N</enc></e>";
    var cookieValue;
    if (value) {
        cookieValue = cookieStart;
        cookieValue += value;
        cookieValue += cookieEnd;
    }
    finalCookie= cookieName+"="+cookieValue+";path=/";
 
    var hostName = document.location.hostname;
    hostName.toLowerCase();
    var domain = '';
    if (hostName.indexOf ('sciencedirect.com') != -1) {
        domain = '.sciencedirect.com';
    } else if (hostName.indexOf('.lexisnexis.com') != -1) {
        domain = '.lexisnexis.com';
    }
    if (domain) {
       finalCookie += ";domain=" + domain;
    }
    document.cookie = finalCookie; 
}

function getDateTime() {
  var ct=new Date();
  return ct.getFullYear()+"/"+ct.getMonth()+"/"+ct.getDate()+"/"+ct.getHours()+":"+ct.getMinutes()+":"+ct.getSeconds();
}

function getCombinedSrcTitle(item) {
  var srcTitle="";
  if (item.SATSRCINFO && item.SATSRCINFO.length) 
  { srcTitle += item.SATSRCINFO[0].SRCTITLE;
    if (item.CONTENTSUBTYPE && ("M" != item.CONTENTSUBTYPE) && item.PUBTITLE)
    { srcTitle += '<span class="noIt">, from </span>' + item.PUBTITLE; }
  }
  if ("" == srcTitle) { srcTitle = item.PUBTITLE; }
  return srcTitle;
}

// PDFCITE Begin
var pdfCite = {
  suggestedArtDisplayed : false,
  pdfWin : "",
  openPDF:function(url, event) {
    var newWidth=$(window).width()*.9;
    var newHeight=$(window).height()*.9;
    pdfWin=window.open(url,'newPdfWin','width='+newWidth+',height='+newHeight+',resizable=yes,left=50,top=50');
    pdfWin.focus();
    pdfCite.popupTabwrap();
  },
  closePopup:function(){
    doc.getById('suggestedPdfList').style.display = 'none';
    doc.getById('pdfModalWindow').style.display = 'none';
    $('#pdfLink').focus();
  },
  popupTabwrap:function(){
      var obj = $('#pdfModalWindowMsgBox');
      obj.find('a:last').keydown(function(e) {                       
        if (e.keyCode == 9 && !e.shiftKey) {                       
          e.preventDefault();                                
          $(obj).find('a:first').focus();               
        }
      })                                      
      obj.find('a:first').keydown(function(e) {                      
        if (e.keyCode == 9 && e.shiftKey) {                        
          e.preventDefault();                                
          $(obj).find('a:last').focus();                
        }
      })
  },
  setOptOutFlag:function(url) {
    try {
      $.post(url);
    }catch(e){}
    pdfCite.closePopup ();
  },
  alignSuggestedArticleBox:function() {
    var x=0, y=1;
    var msgBox = $('#pdfModalWindowMsgBox');
    var winWidth = $(window).width();
    var winHeight = $(window).height();
    var top = (winHeight - msgBox[0].offsetHeight)/2;
    var left = (winWidth - msgBox[0].offsetWidth)/2;
    var pos = pdfCite.getScrollXY();
    if (pos) {
      top = top+pos[y];
      left = left+pos[x];
    }
    msgBox.css('top',top + 'px');
    msgBox.css('left',left + 'px');
    $(window).unbind('focus').bind('focus',function(){
      $("#modalBoxDisplay").focus();
      $('#pdfkingArtTitle0').focus();
      $(window).unbind('focus');
    });
  },
  showDetails:function(pii, absUrl){
    var toHide = "trunc_" + pii;
    var toShow = "citation_" + pii;
    var absId = "abs_" + pii;
    $('li.pdfAbs').hide();
    $('li.citationDetails').hide();
    $('li.wrapperLi').show();
    doc.getById(toHide).style.display = 'none';
    doc.getById(toShow).style.display = 'block';
    // Retrieve Abstract
    var obj = doc.getById(absId);
    if(obj.length < 1) { return; }
    if (obj.innerHTML == "") {
      var ajaxReq = $.get(absUrl, function(response) {
      if (response) {
        obj.style.display = 'block';
        obj.innerHTML=response;
        pdfCite.alignSuggestedArticleBox();
      }
      });
    } else {
      obj.style.display = 'block';
      pdfCite.alignSuggestedArticleBox();
    }
  },
  hideElementsByClassName:function(className, tag)  {
    var all = getElementsByClassName(document, tag, className);
    for(var k=0;k<all.length;k++) {
      all[k].style.display = "none";
    }
  },
  showElementsByClassName:function(className, tag, startIndex)  {
    var all = getElementsByClassName(document, tag, className);
    var idx =0;
    if (startIndex!=null){
      idx = 1;
    }
    for(var k=idx;k<all.length;k++) {
      all[k].style.display = "inline";
    }
  },
  suggestedArt:function(url) {
    var ajaxReq = $.get(url, function(response) {
      response = $.trim(response);
      if (response && response.length > 0) {
        pdfCite.buildSuggestedArticleList(response, "relatedArtList");
        $('#pdfkingTab').addClass('active');
        $('#pdfkingTab').show();
        $('#pdfciteContent').hide();
        $('#pdfciteTab').removeClass('active');
        $('#suggestedPdfList').css('display','block');
        $('#pdfkingContent').show();
        $('#pdfModalWindow').css('display','block');
        $('#pdfModalWindow').css('height', $(window).height()+"px");
        pdfCite.alignSuggestedArticleBox();
      }
    });
  },
  citingArt:function(url) {
  var helpURL = SDM.helpUrlDomain+ "/sdhelp_CSH.htm#citing_art_lrn_more.htm";
    if (pdfCite.citedArtDisplayed) { return; }
    var ajaxReq = $.get(url, function(response) {
      pdfCite.citedArtDisplayed = true;
      response = $.trim(response);
      if (response && response.length > 0) {
        pdfCite.buildSuggestedArticleList(response, "citingArtList");
        $('#pdfciteTab').show();
        if (!pdfCite.suggestedArtDisplayed) {
          $('#suggestedPdfList').css('display','block');
          $('#pdfModalWindow').css('display','block');
          $('#pdfModalWindow').css('height', $(window).height()+"px");
          $('#pdfciteContent').show();
          $('#pdfciteTab').addClass('active');
          pdfCite.alignSuggestedArticleBox();
         }
      } else {
        $('#citingArtList').html("<div class='msgBox'>There are no articles that cite the article you downloaded.&nbsp;<a class = 'learn-more' href = '#' onclick='openNS(\""+helpURL+"\");'>Learn more</a></div> ");
        $('#pdfciteTab').show();
       }
    })
    .error(function() {
      $('#citingArtList').html("<div class='msgBox'>There are no articles that cite the article you downloaded.&nbsp;<a class = 'learn-more' href = '#' onclick='openNS(\""+helpURL+"\");'>Learn more</a></div>");
   });
  },
  toggleSuggestedTabs:function(showTab, hideTab, elem) {
    if ((showTab == '#pdfcite') && (pdfCite.citedArtURL != null)) {
      pdfCite.citingArt(pdfCite.citedArtURL);
    }
    $(elem).parent().addClass('active');
    $(showTab+'Content').css('display','block');
    $(hideTab+'Content').css('display','none');
    $(hideTab+'Tab').removeClass('active');
    $(showTab+'ArtTitle0').focus();
  },
  buildSuggestedArticleList:function(jsonStr, jsonObj) {
  var helpURL = SDM.helpUrlDomain+ "/sdhelp_CSH.htm#citing_art_lrn_more.htm";
    var obj = jQuery.parseJSON(jsonStr);
    var enableEntitlement =$('#'+jsonObj).attr('data-entitled');
    if (jsonObj == "citingArtList") {
      if (obj.ERR_TYPE=="0")  {
        $('#citingArtList').html("<div class='msgBox'>There are no articles that cite the article you downloaded.&nbsp;<a class = 'learn-more' href = '#' onclick='openNS(\""+helpURL+"\");'>Learn more</a></div>");
      } else if (obj.ERR_TYPE=="3") {
        $('#citingArtList').html("<div class='msgBox1'><div class='msgBox3'>The citing articles could not be retrieved at this time.</div><div class='msgBox2'>Click the link below to view the citing articles in Scopus.</div></div>");
      }
    }    
    var artList='';
    var htmlStr='';
    var msgHtml='';
    var jsonQStr='';
    var qStr='';
    var articleTitleId ='';
    if (obj != null) {
      if (jsonObj=="relatedArtList" && obj.citation.length) {
        pdfCite.suggestedArtDisplayed = false;
      }
      $.each (obj.citation, function(i, item){
         var noPDF = (obj.NO_PDF_LINK && obj.NO_PDF_LINK=="Y")?"Y":"N";
         var showMoreUrl = SDM.urlPrefix + '/more/' + item.PII + "/" + obj.TYPE;
         artList += '<ol class="artList"><li class="';
         if (enableEntitlement =='Y' && obj.ERR_TYPE!="2" && noPDF!="Y") {
           artList +='artTitleSub';
         } else {
           artList +='artTitleNonSub';
         }
         if (jsonObj == "citingArtList") {
           jsonQStr= item.QUERYSTRING;
           qStr = jsonQStr.replace('_fmt=high', '_fmt='+obj.FORMAT_TAG);
           articleTitleId = "pdfciteArtTitle"+i;;
         } else {
           qStr= item.QUERYSTRING;
           articleTitleId = "pdfkingArtTitle"+i;
         }
		 
         artList +='"><a id ="' +articleTitleId+ '" class="cLink" target="_blank" querystr="' + qStr +'" href="'
                 + item.ARTURL + '">'
                 + item.ARTTITLE + '</a></li>' 
                 + '<li class="source">';
         artList += getCombinedSrcTitle(item);

         if(item.VOLISS) { artList +=', ' + item.VOLISS; }
         if(item.PUBDT) { artList +=', ' + item.PUBDT; }
         if(item.PG) { artList +=', ' + item.PG; }
         artList +='</li><li class="authors">'+ item.AUTHORS
                 + '</li>';
         if (item.PII) {     
	     artList +='<li class="showMore"><span class="moreInfo"><a href="#" data-url="'
                 + showMoreUrl +  '" class="toggleMoreInfo"  aria-describedby="' +articleTitleId+ '">Show abstract</a>'
                 + '</span><span class="moreInfo hidden"><a href="#" class="toggleMoreInfo" aria-describedby="' +articleTitleId+ '">'
                 + 'Close abstract</a></span>';
         }
         if (enableEntitlement =='Y' && obj.ERR_TYPE!="2" && noPDF!="Y") {
            var pdfURL = SDM.urlPrefix +item.PDFURL;
	    artList +='<span class="pipe">&nbsp;|&nbsp;</span><span class="pdf">'
                    + '<a aria-describedby="' +articleTitleId+ '" title="Download PDF" href="' 
                    + pdfURL+'" target="_blank">PDF&nbsp;(' 
                    + item.PDFSIZE + ')</a></span>';
         }
         artList +='<ol><li class="abs"></li></ol></li></ol>';
      });
      artList +='<a target="_blank" class = "view-more" href="' + obj.VIEW_MORE_URL + '" >View ';
      if (jsonObj=="relatedArtList") {
         artList +='more related articles';
         artList +='</a>';
      } else {
         if (obj.ERR_TYPE=="2" || obj.ERR_TYPE=="3") {
	    artList +='details of all citing articles in Scopus.</a>';
         } else {
           artList +='more citing articles';
           artList +='</a>';
         }
      }
      
        if (jsonObj=="citingArtList") {
          if (obj.ERR_TYPE=="0")  {
            msgHtml = "<div class='msgBox'>There are no articles that cite the article you downloaded.&nbsp;<a class = 'learn-more' href = '#' onclick='openNS(\""+helpURL+"\");'>Learn more</a></div> ";
          } else if (obj.ERR_TYPE=="3") {
            msgHtml ="<div class='msgBox1'><div class='msgBox3'>The citing articles could not be retrieved at this time.</div><div class='msgBox2'>Click the link below to view the citing articles in Scopus.</div></div>";
          } else {
            msgHtml ="<div class = 'related-articles-msg'><span>These articles cite the article you downloaded.</span><a class = 'learn-more' href = '#' onclick='openNS(\""+helpURL+"\");'>Learn more</a></div>";
          }
	  $('#citingArticlesMsg').html(msgHtml);
        }
        htmlStr = artList;      
        $('#'+jsonObj).html(htmlStr);
      }
      $(".toggleMoreInfo").bind("click", pdfCite.toggleShowAbs);
      $(document).keyup(function(e){if (e.keyCode == 27) { pdfCite.closePopup(); }});
      if (jsonObj=="relatedArtList") {
        pdfCite.suggestedArtDisplayed = true;
      }
  },
  toggleShowAbs:function(e){
    var obj=$(e.currentTarget);
    var parentObj = $(obj).parents("ol");
    var abs = $(parentObj).find("li.abs");
    var moreInfo = $(parentObj).find("span.moreInfo");
    $('#relatedArtList span.moreInfo, #citingArtList span.moreInfo').each(function(){
        if($(this).hasClass('hidden')){
            $(this).css('display','none');
        }else{
            $(this).css('display','inline-block');
        }
    });
    moreInfo.css('display','inline-block');
    $(obj).parents('span.moreInfo').css('display','none');
    var showMoreUrl = $(obj).attr ("data-url");
      if (showMoreUrl) {    
        $('ol li.abs').hide();      
        $.get(showMoreUrl, function(response) {
            if (response && response.length > 1) {
              $(abs).html("<h2>Abstract</h2>"+response);
              $(abs).show();
            } else {
              $(abs).html("No abstract is available for this article.");
              $(abs).show();
            }
        });
      } else { $(abs).hide(); }
      return false;
  },
  getScrollXY:function(){
    var x=0, y=1;
    var pos = new Array(2);
    var scrOfX = 0, scrOfY = 0;
    if( typeof( window.pageYOffset ) == 'number' ) { //Netscape compliant
      scrOfY = window.pageYOffset;
      scrOfX = window.pageXOffset;
    } else if( document.body && ( document.body.scrollLeft || document.body.scrollTop ) ) {
      //DOM compliant
      scrOfY = document.body.scrollTop;
      scrOfX = document.body.scrollLeft;
    } else if( document.documentElement && ( document.documentElement.scrollLeft || document.documentElement.scrollTop ) ) {
      //IE6 standards compliant mode
      scrOfY = document.documentElement.scrollTop;
      scrOfX = document.documentElement.scrollLeft;
    }
    pos[x] = scrOfX;
    pos[y] = scrOfY;
    return pos;
  }   
}
// End of PDFCITE

function flipAlertSettings (id, currObj) {
  var obj = document.getElementById (id);
    if (obj.style.display == 'none') {
      obj.style.display = 'block';
      currObj.className = 'regMMinus';
      currObj.innerHTML = "Hide alert & other settings.";
    } else {
      obj.style.display = 'none';
      currObj.className = 'regMPlus';
      currObj.innerHTML = "Show alert & other settings.";
    }
}

function displayMarketingInfo(id, currObj) {
  var obj = document.getElementById (id);
    if (obj.style.display == 'none') {
      obj.style.display = 'block';
      currObj.className = 'regMMinus';
    } else {
      obj.style.display = 'none';
      currObj.className = 'regMPlus';
    }
    currObj.innerHTML = "I wish to receive information from Elsevier B.V. and its affiliates concerning their products and services.&nbsp;&nbsp;&nbsp;&nbsp;";
}

//ce:e-component
var ECC = {
  selectorDisplayCount:10,
  audioPlayerWidth:318,
  audioPlayerHeight:29,
  videoPlayerWidth:320,
  videoPlayerHeight:266,
  reqFlashVersion:"9.0.0",
  reqMajorVersion:9,
  reqMinorVersion:0,
  videoNoFlashWidth:318,
  videoNoFlashHeight:260,
  audioPlayerURL:"/page/flash/AudioPlayer.swf",
  videoPlayerURL:"/page/flash/VideoPlayer.swf"
};
var EComponent = {
  scope: "",
  videos: null,
  others: null,
  audios: null,
  needFlash: false,
  init: function(fragId) {
    if(typeof fragId!='undefined') {
      this.scope = '#' + fragId + ' ';
    }

    if($(this.scope + '.MMCvAUDIO').length+
       $(this.scope + '.MMCvOTHER').length+
       $(this.scope + '.MMCvVIDEO').length==0) {
      return;
    }
    
    var fv = swfobject.getFlashPlayerVersion();
    if(ECC.reqMajorVersion==0 || ECC.reqMajorVersion > fv.major || (ECC.reqMajorVersion == fv.major && ECC.reqMinorVersion>fv.minor)) {
      this.needFlash = 'true';
      this.initNoFlash('version_mismatch');
    }
    else {
    this.audios = $('.MMCvAUDIO');
    $(this.scope + '.MMCvAUDIO').each(function() {
      swfobject.embedSWF(
          SDM.urlPrefix+ECC.audioPlayerURL,
          $(this).siblings('div').attr('id'),
          ECC.audioPlayerWidth,
          ECC.audioPlayerHeight,
          ECC.reqFlashVersion,
          false,
          false,  //flashvars
          {menu: "false",
          play: "false",
          bgcolor: "0xFFF",
          allowscriptaccess:"always",
          wmode: "opaque",
          flashvars: $(this).attr('mmcvflashvars')});
    });
    this.others = $('.MMCvOTHER');
    this.videos = $('.MMCvVIDEO');
    $(this.scope + '.MMCvVIDEO').each(function() {
      swfobject.embedSWF(
          SDM.urlPrefix+ECC.videoPlayerURL,
          $(this).siblings('div').attr('id'),
          ECC.videoPlayerWidth,
          ECC.videoPlayerHeight,
          ECC.reqFlashVersion,
          false,
          false, //flashvars
          {menu:"false",
          play: "false",
          bgcolor:"0xFFF",
          allowscriptaccess:"always",
          allowFullScreen:"true",
          wmode:"opaque",
          flashvars:$(this).attr('mmcvflashvars')});
    });
    }
    this.buildMMClabelanchor();
    //if(SDM.suppContentBox==true) this.buildWidget();
  }, // EComponent.init
  buildMMClabelanchor: function(){
      $(this.scope + 'dd.ecomponent').each(function(i){
          var thisObj = $(this).parent('dl');
          var downLinkObj = thisObj.find(".MMCvLINK");
          var captionObj = thisObj.find(".MMCvLABEL_SRC a");
          if(downLinkObj && captionObj){
              var downLinkUrl = $(downLinkObj).attr('href');
              $(captionObj).attr('href',downLinkUrl);
          }
      });    
  },
  initNoFlash: function(str){
    //Do something
  }
}

function assignPosition(d) {
  if (/MSIE (\d+\.\d+);/.test(navigator.userAgent)) {
     d.css("left", Number(linkBufObj.offsetLeft + linkBufObjLeft) + "px");
     var linkId = linkBufObj.id;
     var linkNum = linkId.substring(9,linkId.length);
     var numPrev = Number(linkNum) - 1;
     var numPrevs = Number(linkNum) - 2;
     var numNext = Number(linkNum) + 1;
     var prevEle = doc.getById("authname_" + numPrev);
     var nextEle = doc.getById("authname_" + numNext);
     var prevestEle = doc.getById("authname_" + numPrevs);
     var posPrev;
     var posNext;
     if(prevEle != null){
      posPrev = findPosY(prevEle);
     } else {
      posPrev = findPosY(linkBufObj);
     }
     if(posPrev ==  findPosY(linkBufObj)){
      d.css("top", findPosY(linkBufObj) + linkBufObj.offsetHeight + 5 + "px");
     } else {
       if(nextEle != null){
        posNext = findPosY(nextEle);
       } else {
        if(prevestEle != null && posPrev == findPosY(prevestEle) ){
         posNext  = findPosY(linkBufObj) + 27;
        } else {
         posNext  = findPosY(linkBufObj);
        }
       }
       d.css("top", posNext + linkBufObj.offsetHeight + 5 + "px");
     }
     d.css("display", "block");

  } else {
     d.css("left", Number(linkBufObj.offsetLeft + linkBufObjLeft) + "px");
     d.css("top", findPosY(linkBufObj) + linkBufObj.offsetHeight + 2 + "px");
     d.css("display", "block");
  }
}


function textBoxCE(textObj,imptr) {
  var child=doc.getById(textObj);
  var imgChild=doc.getById(imptr);
  if(child.style.display!="block") {
    child.style.display="block";
    imgChild.src="/scidirimg/minus.gif";
  }
  else{
    child.style.display="none";
    imgChild.src="/scidirimg/plus.gif";
  }
}

function toggleFigLblMMCStyling()
{
  var defBoxes;
  var crntLblDivs;

  defBoxes = getElementsByClassName(document, 'DIV', 'textboxdefault');

  for(var k=0;k<defBoxes.length;k++) {
    crntLblDivs = getElementsByClassName(defBoxes[k], 'SPAN', 'nodefault');
    if (crntLblDivs.length == 0) {
      defBoxes[k].style.background = 'none';
      defBoxes[k].style.border = '0 none';
      defBoxes[k].style.margin = '0 0 0 15px';
    }
  }
}

function findPosY(obj) {
  var curtop = 0;
  if(obj.offsetParent) {
    while(1) {
      curtop += obj.offsetTop;
      if(!obj.offsetParent) { break; }
        obj = obj.offsetParent;
      }
  }
  else if(obj.y) {
    curtop += obj.y;
  }
  return curtop;
}
//Auth hover End

function hideModalBox(){
  doc.getById("modalBoxDisplay").style.display="none";
}

function setCenterAlign() {
  var msgBox = $('#modalWindowMsgBox');
        var winWidth = $(window).width();
        var winHeight = $(window).height();
        var top = (winHeight - msgBox[0].offsetHeight)/2;
        var left = (winWidth - msgBox[0].offsetWidth)/2;
  msgBox.css('top',top+ 'px');
  msgBox.css('left',left+ 'px');
  $('#modalWindow').css('height',winHeight +'px');
}

function requestHeightAdjust(id, h) {
  if(h>50 && !$('#' + id).find('.adText')[0]){
    $('#' + id).prepend('<div class="divider"></div><div class="adText">ADVERTISEMENT</div>');
  }
  $('#' + id).height(h+20);
  $('#' + id + ' iframe').height(h+20);
}

// default page layout settings
var pgLayout={
  vpWidth : $(window).width(),
  lcWidth : 260,
  ccWidth : 700,
  rcWidth : 300,
  rcFloatWidth:320,
  pgWidth : 1606,
  lcLeft : 0,
  ccLeft : 260,
  rcLeft : 960,
  pgLeft : 0,
  showLeftBar:true,
  showRightBar:true,
  animDuration:300,
  holdAnimation:500,
  bibliographicPanelDisplayed: false,
  relatedCitingPanelDisplayed: false,
  applicationPanelDisplayed: false,
  hoverOnColor:'#fff',
  hoverOffColor:'#ECF2F6',
  glowOnColor:'#C1D3E1',
  glowOffColor:'#ECF2F6'
};

//NewArtDeux Start
// right pane sidebar start
var rightSidePane={
  sendRightPaneKeyEvents: function(a, o, z) {
    $.get(SDM.userActionURL+'/'+o+'/'+z+'/'+a);
  },
  openPane: function() {
    $('#rightInner').css('margin-left','0');
    $('#rightInner').show();
    pgLayout.showRightBar=true;
    $('.toggleSideBar').unbind('click', rightSidePane.togglePane);
    //$('.toggleSideBar div').removeClass('open').addClass('close');
    $(".toggleSideBar").hide();
    rightSidePane.resizeAccordion();
    $('body').unbind('click', rightSidePane.handleMouseClick);
  },
  closePane: function() {
    $('#rightInner').css('margin-left',19);
    if(pgLayout.showRightBar==false) {
      $('#rightPane').stop().animate({ 'left': (pgLayout.rcLeft+pgLayout.rcFloatWidth)},  pgLayout.animDuration, function() {
          $(".toggleSideBar").show();
          $('#rightPane').css('width', pgLayout.rcWidth).css('left', pgLayout.ccLeft+pgLayout.ccWidth);
          $('.toggleSideBar div').removeClass('close').addClass('open');
      });
    }
    pgLayout.showRightBar=false;
    $('.toggleSideBar').bind('click', rightSidePane.togglePane);
    rightSidePane.resizeAccordion();
    $('body').unbind('click', rightSidePane.handleMouseClick);
  },
  togglePane: function(actPanel) {
    if(pgLayout.showRightBar==false) {
      $('#rightPane').css('width',pgLayout.rcFloatWidth);
      $('#rightInner').show().css('margin-left',19);
      $('.toggleSideBar div').removeClass('open').addClass('close');
      $('#rightPane').stop().animate({ 'left': (pgLayout.rcLeft-$('#rightInner').width())},  pgLayout.animDuration,function(){
          pgLayout.rcLeft=parseFloat($('#rightPane').css('left'),10);
          pgLayout.showRightBar=true;
          if(typeof actPanel =='string' && !$("#rightInner h2.ui-state-active").hasClass(actPanel)) $('#rightInner').accordion("option", "active",'.'+actPanel);
      });
      $('body').bind('click', rightSidePane.handleMouseClick);
      rightSidePane.sendRightPaneKeyEvents('openRightPane', 'article', 'rightPane');
    } else {
      $('#rightPane').stop().animate({ 'left': (pgLayout.rcLeft+$('#rightInner').width())},  pgLayout.animDuration,function(){
          $('.toggleSideBar div').removeClass('close').addClass('open');
          pgLayout.rcLeft=parseFloat($('#rightPane').css('left'),10);
          $('#rightInner').hide();
          $('#rightPane').css('width',20);
          $('#rightInner').css('margin-left','');
          pgLayout.showRightBar=false;
      });
      $('body').unbind('click', rightSidePane.handleMouseClick);
      rightSidePane.sendRightPaneKeyEvents('closeRightPane', 'article', 'rightPane');
    }
    rightSidePane.resizeAccordion();
  },
  initAccordion: function () {
    $('#rightInner').accordion({
        'fillSpace':true,
        'icons':false,
        'active':false,
        'collapsible': true,             
        'changestart': function(event,ui) {
            selObj=$(ui.newContent).children('.innerPadding, .innerPaddingApp');
            if($(selObj).hasClass('js_bibliographic_content')){
              rightSidePane.getBibliographicPanel(selObj);
            }else if($(selObj).hasClass('js_citation_content')){
              rightSidePane.getRelatedCitingPanel(selObj);
            }else if($(selObj).hasClass('js_application_content')){
              rightSidePane.resetAccordionStyling();
              rightSidePane.sendUserKeyEvents('displayRightPanePanel', 'article', 'rightPane', SDM.keOriginContentFamily, 'applications');
            }else if($(selObj).hasClass('js_workspace_content')){
              rightSidePane.sendUserKeyEvents('displayRightPanePanel', 'article', 'rightPane', SDM.keOriginContentFamily, 'workspace');
            }
            $(ui.newContent).css({'overflow-y': 'auto', 'overflow-x': 'hidden'});
        },
        'change': function(event,ui) {
            $('#rightInner').accordion('resize');
            selObj=$(ui.newContent).children('.innerPadding, .innerPaddingApp');
            rightSidePane.showRightAd(selObj);
            //if(mathRenderer.opt.renderOn)MathJax.Hub.Queue(["Typeset",MathJax.Hub,$('#rightPane')[0]]);
            if(mathRenderer.opt.renderOn)mathRenderer.handleRerender($('#rightPane'));
            mathRenderer.activateButtons();
        }
    });
    $('#rightPane .accordionContent, #rightPane .accordionHead').hover(
        function() {
          var obj;
          if($(this).hasClass('accordionHead')) {
            obj=$(this).next('#rightPane .accordionContent');
          }
          else{
            obj=$(this);
          }
          rightSidePane.hoverOn(obj);
        },
        function() {
          var obj;
          if($(this).hasClass('accordionHead')) {
            obj=$(this).next('#rightPane .accordionContent');
          }
          else{
            obj=$(this);
          }
          rightSidePane.hoverOff(obj);
        } 
    );
    rightSidePane.setAccordionStyling();
    rightSidePane.setDefaultPane();
  },
  resizeAccordion: function () {
    $('#rightInner').accordion('resize');
    rightSidePane.hoverOff($('#rightPane div.ui-accordion-content-active'));
  },
  setAccordionStyling: function () {
    $('div.js_application_content').parent().css({'display': ''});
    $('div.js_application_content').parent().removeClass('ui-accordion-content');
    $('div.js_application_content').parent().css({'visibility': 'hidden', 'top': '-1000px', 'position': 'absolute', 'left': '-1000px'});
  },
  resetAccordionStyling: function () {
    $('div.js_application_content').parent().css({'visibility': '', 'top': '', 'position': '', 'left': ''});
  },
  setDefaultPane: function() {
    if (SDM.relatedCitingPanelAvail) {
      $('#rightInner').accordion('option', 'active', '.relatedArticles');
    } else if (SDM.applicationsPanelAvail) {
      $('#rightInner').accordion('option', 'active', '.applications');
    } else {
      $('#rightInner').accordion('option', 'active', '.bibliographic');
    } 
  },
  hoverOn: function(obj){
    $(obj).css({'background-color':pgLayout.hoverOnColor});
    pgLayout.glowOffColor=pgLayout.hoverOnColor;
    $(obj).children('.hidescrollbar').css({'display':'none'});
    if(!$(obj).children('.innerPadding').hasClass('js_workspace_content')){
      $(obj).css({'overflow-y':'auto','overflow-x':'hidden' });
    } 
  },
  hoverOff: function(obj){
    $(obj).css({'background-color':pgLayout.hoverOffColor});
    pgLayout.glowOffColor=pgLayout.hoverOffColor;
    $(obj).children('.hidescrollbar').css({'display':'block'});
    if($(obj)[0]){
      if($(obj).height()<$(obj)[0].scrollHeight && !$(obj).children('.innerPadding').hasClass('js_workspace_content')){
        $(obj).css({'overflow-y':'hidden','overflow-x':'hidden' });
      }
    } 
  },
  handleMouseClick:function(e){
    if(!$(e.target).parents('#rightPane').attr('id')
        && $(e.target).attr('class')!='intra_ref'
        && $('.toggleSideBar').css('display')=='block') {
      rightSidePane.togglePane();
    }
  }, 
  sendUserKeyEvents: function(a, o, z, ocf, p) {
    $.get(SDM.userActionURL+'/'+o+'/'+z+'/'+ocf+'/'+a+'/'+p);
  },
  getBibliographicPanel:function(obj){
    rightSidePane.sendUserKeyEvents('displayRightPanePanel', 'article', 'rightPane', SDM.keOriginContentFamily, 'biblioInfo');
    if (pgLayout.bibliographicPanelDisplayed) { return; }
    var authorStr='';
    $(".authorGroup").each (function() {
      if($(this).hasClass('noCollab')){
        $(this).find(".authorName").each (function() {
            if(!$(this).parents('.collab')[0]){
              if (authorStr != '' && !$(this).hasClass('text')) { authorStr += ', '; }
      authorStr += $(this).text();
      var authDegree = $(this).next('span.authorDegrees');
      if(authDegree != null && $(authDegree).text() != '') {
        authorStr += ', ';
        authorStr += $(authDegree).text();
      }
            }
        });
        var collab = $(this).find('.collab');
        if (collab != null && $(collab).text() != '') { 
          authorStr += ', ';
          authorStr += $(collab).find(".collabText").text();
        };
        if ($(collab).find('.authorGroup')[0]) {
          var collabAuthors = $(collab).find('.authorGroup');
          var collabAuthorStr = '';
          authorStr += ' (';
          $(collabAuthors).find(".authorName").each (function() {
              if (collabAuthorStr != '') { collabAuthorStr += ', '; }
              collabAuthorStr += $(this).text();
              var authDegree = $(this).next('span.authorDegrees');
              if(authDegree != null && $(authDegree).text() != '') {
                collabAuthorStr += ', ';
                collabAuthorStr += $(authDegree).text();
              }
          });
          authorStr += collabAuthorStr;
          authorStr += ')';
        };
      }
    });
    var articleTitle = $(".svTitle").html();
    var doiLink = '<a href="http://dx.doi.org/' + SDM.doi + '">http://dx.doi.org/' + SDM.doi + '</a>';
    var modSrcTitle=$(".publicationHead div.modSrcTitle").text();
    var pubTitle = $(".publicationHead div.title > a span").text();
    if (pubTitle == "") {
      pubTitle = $(".publicationHead div.title").find("img").attr("alt");
    }
    if(modSrcTitle!=''){
      if (pubTitle != undefined){
          pubTitle = modSrcTitle + ', from ' + pubTitle; 
      }else {
	  pubTitle = modSrcTitle ;
      }
    }
    var volIssueDetails = $(".publicationHead p.volIssue").text();
    var artHistory =  $(".articleDates").html();
    var exportCitation = $('.icon_exportarticle'+SD_UTIL.getProdColor()).outerHTML();
    var clonedObj;
    if (exportCitation != '') {
      clonedObj = $(exportCitation).clone();
      var url = $(clonedObj).find('a').attr('href');
      url = url.replace("toolbar", "rightPane");
      url += '&panel=biblioInfo';
      $(clonedObj).find('a').attr('href', url);
    }
    var nonSerialInfo = '';
    if (SDM.editorsInChief)  { nonSerialInfo = SDM.editorsInChief; }
    if (SDM.publicationCity) {
      if (nonSerialInfo != '') { nonSerialInfo += ', '; }
        nonSerialInfo += SDM.publicationCity;
      }

    var htmlStr = '<dl class="citation"><dd>' + authorStr + '</dd><dd class="title">'
                      + articleTitle + '</dd><dd class="pubInfo">' + pubTitle;
    if (nonSerialInfo != '') { htmlStr += ', ' + nonSerialInfo };
    if (volIssueDetails != '') { htmlStr += ', ' + volIssueDetails };
    htmlStr +='</dd><dd class="doi">' + doiLink + '</dd>';
    if (SDM.isCrossMark) {
      htmlStr +='<dd class="crossMarkInfo">';
      htmlStr += '<div>';
      htmlStr +=  '<a id="open-crossmark" href="#" style="padding: 6px 0 6px 0;"><img id="crossmark-icon" src="http://crossmark.crossref.org/images/logos/cm_sbs_018_plain.png" /></a>';  
      htmlStr +=  '<meta name="dc.identifier" content="doi:' + SDM.doi + '"></meta>';
      htmlStr += '</div>'; 
      htmlStr += '<div id="crossmark-dialog" style="display:none;" title="">';
      htmlStr +=  '<iframe id="crossmark-dialog-frame" frameborder="0"></iframe>';
      htmlStr += '</div>';
      htmlStr +='</dd>';
    };
    htmlStr +='</dl>';
    if (artHistory != null) { htmlStr += '<dl class="articleHistory"><h3>Article history</h3>'+ artHistory + '</dl>'; }
    if (clonedObj || SDM.outwardLinks) { htmlStr += '<ul class="outwardLinks">'; }
    if (clonedObj != null) { htmlStr += '<li class="clearfix">' + $(clonedObj).outerHTML() + '</li>'; }
    if (SDM.outwardLinks) { htmlStr += '<li>' + SDM.outwardLinks + '</li>'; }
    if (exportCitation || SDM.outwardLinks) { htmlStr += '</ul>'; } 
    obj.prepend(htmlStr);
    if (SDM.isCrossMark){CrossMark.init();}
    pgLayout.bibliographicPanelDisplayed = true;
  },
  getRelatedCitingPanel:function(obj){
    rightSidePane.sendUserKeyEvents('displayRightPanePanel', 'article', 'rightPane', SDM.keOriginContentFamily, 'citeRelatedArt');
    if (pgLayout.relatedCitingPanelDisplayed) { return; }

    if (SDM.rerunAvail && SDM.rerunJson !='') {
      var obj = $.parseJSON (decodeURIComponent(SDM.rerunJson));
      rightSidePane.buildArticleList (obj, "rerunArticles");
    }

    if (SDM.isSpecialIssue) {
      var specIssURL=SDM.urlPrefix + '/spliss/rslts/' + SDM.hubEid + '/' + SDM.pm.pii;
      var getArticleList=function(res){rightSidePane.buildArticleList(res, "specIssueList", true);};
      $.getJSON (specIssURL, getArticleList);
    }

    // Dont display the box when crawler is enabled
    if(SDM.crawlerAvail==true) { return; }

    if(SDM.mlktAvail) {
      var relatedArtURL=SDM.urlPrefix +'/mlkt/rslts/'+SDM.pm.pii+'/Art'
      var getArticleList=function(res){rightSidePane.buildArticleList(res, "relArtList");};
      $.getJSON (relatedArtURL, getArticleList);

      if(SDM.relatedRefAvail==true) {
        var relatedRefURL=SDM.urlPrefix +'/mlkt/rslts/'+SDM.pm.pii+'/Ref';
        var getArticleList=function(res){rightSidePane.buildArticleList(res, "relRefList");};
        $.getJSON (relatedRefURL, getArticleList);
      }
    }

    if(SDM.citedByScAvail) {
      var citedByURL=SDM.urlPrefix +'/citedby/rslts/'+SDM.pm.pii;
      var getArticleList=function(res){rightSidePane.buildArticleList(res, "citedByList");};
        $.getJSON (citedByURL, getArticleList);
    }

    pgLayout.relatedCitingPanelDisplayed = true; 
  },
  toggleMoreInfo:function(e){
    var obj = $(e.target);
    var showMoreUrl = $(obj).attr ("data-url");
    var moreInfo = $(obj).parent().parent().find("div.moreInfo");
    moreInfo.toggle();
    var abs = moreInfo.find("div.abs");
    if (showMoreUrl && abs.html() == "") {
      $.get(showMoreUrl, function(response) {
          if (response.length > 1) {
            var absStr = '<h4>Abstract</h4>';
            absStr += response;
            abs.html(absStr);
            abs.show();
          }
      });
    }
    
    if(typeof sqClick=='function'&&obj.parents('#relArtList').length) { sqClick(obj,'mlktShowMore','122'); }
    return false;    
  },
  buildArticleList:function(res, targetId, isSpecialIssue) {
    var artList = '';
    var cacheType = res.TYPE;
    if (cacheType == '5') {
        $('#rightPane span#hitcount').html(res.HITCOUNT);
    }
    if (res) {
      if (cacheType == '8') { 
        if (parseInt(res.ARTICLE_COUNT) > 0 && $(res.citation).length > 0) {
          artList += '<h3 class="scopusInfo"><div><span class="bold">More documents by </span>'
          artList += '<a href="' + res.AUTH_PROFILE_URL + '">' + res.AUTHOR_NAME  + '</a></div><div class="scopus">Provided by Scopus</div></h3>';
        } else {
          return;
        }
      }
      if(cacheType == '9') {
        var titleEditors = $(".titleEditors").text();
        var specIssueTitle = $(".specIssueTitle").text();
        var specIssueUrl = $(".publicationHead p.volIssue").find("a").attr("href");
        artList += '<h3>This article belongs to a special issue</h3><ol class="specIssue"><li class="specIssTitle"><a class="cLink" queryStr="?&zone=rightPane&panel=biblioInfo" href="' + specIssueUrl + '">' + specIssueTitle + '</a><li class="editor">' + titleEditors + '</li></ol>';
        artList += '<h3>Other articles from this special issue</h3>';
      }
      if ($(res.citation).length < 1) {
        $('#'+targetId).parent().show();
        return;
      }
      $.each (res.citation, function(i, item){
          var key = item.PII?item.PII:item.SCEID;
          var showMoreUrl = SDM.urlPrefix + '/more/' + key + '/' + cacheType; 
          artList += '<li><ol class="articles"><li class="artTitle"><a title="' + item.ARTTITLE + '" href="' + item.ARTURL + '"';
          if (item.QUERYSTRING) {
              artList += ' class="cLink" queryStr="' + item.QUERYSTRING + '"';
          }
          artList += '>' + item.ARTTITLE + '</a></li>';
          if (isSpecialIssue == true) {
            artList += '<li class="authors">' + item.AUTHORS + '</li>';
          } else {
            artList += '<li class="srcTitle">' + item.PUBYR;
            if (item.PUBYR) { artList += ', '; }
            artList += getCombinedSrcTitle(item) + '</li>';
          }
          artList += '<li class="showMore">'
                  +  '<div class="moreInfo"><a data-url="' + showMoreUrl +  '" class="toggleMoreInfo closed">Show more information</a></div>'
                  +  '<div class="moreInfo hidden">'
                  +  '<a class="toggleMoreInfo opened">Close</a><ol class="details"><li>' + item.AUTHORS + '</li><li class="title">' + item.ARTTITLE + '</li>';
          artList += '<li class="fullSrcTitle">';
          artList += getCombinedSrcTitle(item);
          if (item.VOLISS) { 
             artList += ', ' + item.VOLISS; 
          } else {
             if (item.VOL) {
                if ((item.VOL).indexOf('-') != -1) {
                    artList += ', Volumes ';
                } else {
                    artList +=', Volume ';
                }
                artList += item.VOL;
             }
             if (item.ISS) {
                if ((item.ISS).indexOf('-') != -1) {
                    artList +=', Issues ';
                } else {
                    artList +=', Issue ';
                }
                artList += item.ISS; 
             }
          }
          if (item.PUBDT) { artList += ', ' + item.PUBDT; }
          if (item.PG) { artList += ', ' + item.PG; }
          artList += '</li>';
          if (item.LBL) { artList += '<li class="docSubType">' + item.LBL + '</li>'; }
          artList += '<div class="abs"></div>';
          if (item.PDFURL) {
            artList += '<ul class="links"><li class="clearfix pdf"><div class="icon_pdf"><div class="icon"></div><a title="Download PDF" class="pdfRightPaneLink" href="';
            artList += item.PDFURL;
            artList += '"> PDF';
            if (item.PDFSIZE) {
              artList += ' (';
              artList += item.PDFSIZE;
              artList += ')';
            }
            artList += '</a></div></li></ul>';
          }
          if (cacheType == '5' && item.VIEW_RECORD_URL) {
              artList += '<ul><li><a href="' + item.VIEW_RECORD_URL + '">View details in Scopus</a></li><ul>';
          }
          if (item.PDFURL ||  item.VIEW_RECORD_URL) { 
              artList += '</ul>';
          }
          artList += '</ol></div></li></ol></li>'
      });
      var moreUrl = '';
      if (cacheType == '9') {
        moreUrl = $(".publicationHead p.volIssue").find("a").attr("href");
      } else {
        moreUrl = res.VIEW_MORE_URL;
      }
      if (cacheType != '8') {
        if ( moreUrl != '' && parseInt(res.HITCOUNT) > parseInt(res.MAX_ARTICLES_TO_DISPLAY) ) {
            artList += '<li><a href="' + moreUrl + '" class="viewMoreArticles cLink"'; 
            if (cacheType == '9') {
                artList += ' class="cLink" queryStr="?&zone=rightPane&panel=biblioInfo"'; 
            }
            artList += '>View more articles &raquo;</a></li>';
        }
      } else {
        if (parseInt(res.ARTICLE_COUNT) > 3) {
          artList += '<li class="scopusMoreLink"><a href="' + res.AUTH_ARTICLE_COUNT_URL + '">View more documents authored by '
                  + res.AUTHOR_NAME + '</a></li>';
        }
        if (parseInt(res.CITEDBY_COUNT) > 0) {
          artList += '<li class="scopusMoreLink"><a href="' + res.AUTH_CITEDBY_COUNT_URL + '">View more documents that cite '
                  + res.AUTHOR_NAME + '</a></li>';
        }
      }
      $('#'+targetId).html (artList);
      $('#'+targetId).parent().show();
      $('.pdfRightPaneLink').click(function(e) {
          var obj = e.target;
          var nw = window.open($(obj).attr('href'), 'newPdfRightPane', 'height=' + $(window).height()*.9 + ',width=' + $(window).width()*.9);
          SD_UTIL.killEvent(e);
      });
      $(".toggleMoreInfo").unbind("click", rightSidePane.toggleMoreInfo ).bind("click", rightSidePane.toggleMoreInfo);
      $('#rightPane li.srcTitle, #rightPane li.authors, #rightPane .artTitle a').ellipsis();
    }
  },
    sendCrossRefKeyEvents: function(a, o, z, ocf) {
          $.get(SDM.userActionURL+'/'+o+'/'+z+'/'+ocf+'/'+a);
    },
    findTargetElement:function(e) {
        var selID='';
        var selIdUnescaped='';
        var wsObj='';
        var isAuthorReq = false;
        var className = $(e.target).closest('a').attr('class');
        if (className == "figureLink") {
            // User clicked on Figure
            wsObj = $(e.target).closest('dl');
            selID = $(wsObj).attr('id');
            selIdUnescaped = selID;
            selID = selID.replace(/[\.]/g, '\\.').replace(/[\:]/g, '\\:');
        } else if (className.indexOf("authorName")!=-1 || className.indexOf("auth_aff")!=-1 || className.indexOf("auth_corr")!=-1) {
            wsObj = $(e.target).closest('a');;
            if (className.indexOf("authorName")!=-1) {
                selID = $(wsObj).attr('id');
            } else { 
                selID = $(wsObj).attr('href').split('#');
                selID = selID[1];
            }
            selIdUnescaped = selID;
            selID = selID.replace(/[\.]/g, '\\.').replace(/[\:]/g, '\\:');      
            isAuthorReq = true;
        } else {
            // IntraRef
            selID=$(e.target).closest('a').attr('href').split('#');
            selID=selID[1];
            selIdUnescaped = selID;
            selID = selID.replace(/[\.]/g, '\\.').replace(/[\:]/g, '\\:');
            wsObj = $('#'+selID);
            if (className.indexOf("intra_ref") != -1) {
                rightSidePane.sendCrossRefKeyEvents('displayCrossRefLink', 'article', 'centerPane', SDM.keOriginContentFamily);
            }
        }

        if (Fragment.isAvail()) {
            if (isAuthorReq) {
                var affObj = $(wsObj).closest('li').find('a.auth_aff');
                var corrObj = $(wsObj).closest('li').find('a.auth_corr');
                var vitaeObj = $(wsObj).closest('li').find('a.authorVitaeLink');

                if ($(affObj)[0] && !$($(affObj).attr('href'))[0]) {
                        var selID = $(affObj).attr('href').split('#');
                        selID = selID=selID[1];
                        if (Fragment.crossRefMap) {
                            var targetFrag = Fragment.getIntraRefFragId (selID);
                            Fragment.get (targetFrag, e.data.z, {successCb: rightSidePane.findTargetElement, successCbArg: e});
                        }
                } else if ($(corrObj)[0] && !$($(corrObj).attr('href'))[0]) {
                        var selID = $(corrObj).attr('href').split('#');
                        selID = selID=selID[1];
                        if (Fragment.crossRefMap) {
                            var targetFrag = Fragment.getIntraRefFragId (selID);
                            Fragment.get (targetFrag, e.data.z, {successCb: rightSidePane.findTargetElement, successCbArg: e});
                        }
                } else if ($(vitaeObj)[0] && !$($(vitaeObj).attr('href'))[0]) {
                        var selID = $(vitaeObj).attr('href').split('#');
                        selID = selID=selID[1];
                        if (Fragment.crossRefMap) {
                            var targetFrag = Fragment.getIntraRefFragId (selID);
                            Fragment.get (targetFrag, e.data.z, {successCb: rightSidePane.findTargetElement, successCbArg: e});
                        }
                } else {
                     rightSidePane.setWorkSpace(e, selID);
                }
            } else {
                if (!$(wsObj)[0]) {
                    // Fragment not loaded yet.
                    if (Fragment.crossRefMap) {
                        DBG.out(1, "Fragment not loaded yet.");
                        //Using the unescaped selID when calling getIntraRefFragId, otherwise it cannot find it. 
                        var targetFrag = Fragment.getIntraRefFragId (selIdUnescaped);
                        Fragment.get (targetFrag, e.data.z, {successCb: rightSidePane.findTargetElement, successCbArg: e});
                    }
                    else {
                        DBG.out(1, 'Maps unavailable so this is a noop');
                    }
                } else {
                    rightSidePane.setWorkSpace(e, selID);
                }
            }
        } else {
            rightSidePane.setWorkSpace(e, selID);
        }

	ArticlePage.closeOptions(e);
	ArticleToolbar.closeOptions(e);
        e.preventDefault();
        e.stopPropagation();
    },       
    setWorkSpace:function(evt, selID) {
        var wsObj = $('#' + selID);

        if(!$(wsObj)[0]) {return;} 
        var data='';

        if($(wsObj)[0].tagName=='DIV' && $(wsObj).hasClass('figure') && $(wsObj).hasClass('table')) wsObj=$(wsObj).closest('div').next('p').next('div').find('dl');

        var wsObjClass=$(wsObj).attr('class')?$(wsObj).attr('class').replace(' ',''):$(wsObj).parent().attr('class').replace(' ','');
        wsObjClass=wsObjClass.replace('svArticle','').replace(' ','');

        var baseElement='dl.'+wsObjClass;
        switch (wsObjClass){
            case 'figure':
                var exeWS=function(wsObj,wsObjClass){return rightSidePane.populateFigures(wsObj,wsObjClass);};
                break;
            case 'table':
                var exeWS=function(wsObj,wsObjClass){return rightSidePane.populateTables(wsObj,wsObjClass);};
                 break;
            case 'references':
                 baseElement='ol.'+wsObjClass+'>li';
                 var exeWS=function(wsObj,wsObjClass){return rightSidePane.populateReferences(wsObj,wsObjClass);};
                 break;
            case 'ecomponent':
                 var baseElement='dd.'+wsObjClass;
                 if ($(wsObj).is('dl')) { wsObj = $(wsObj).find('dd.ecomponent'); }         
                 var exeWS=function(wsObj,wsObjClass){return rightSidePane.populateEcomponents(wsObj,wsObjClass);};
                 break;
            case 'footnote': 
            case 'tblFootnote':
                  var exeWS=function(wsObj,wsObjClass){return rightSidePane.populateFootnote(wsObj,wsObjClass);};
                  break;
            case 'authorName': 
            case 'affiliation': 
            case 'vitae': 
            case 'correspondence':
                  baseElement='.'+wsObjClass;
                  if(wsObjClass!='authorName'){
                      wsObjClass='authorName';
                      baseElement='.'+wsObjClass;
                      wsObj=$(evt.target).parents('li').find(baseElement);
                  }
                  if(wsObjClass=='vitae') {
                      wsObj=$('#b'+$(evt.target).attr('id')).parents('li').find(baseElement);
                  }
                  var exeWS=function(wsObj,wsObjClass){return rightSidePane.populateAuthorInfo(wsObj,wsObjClass);};
                  break;
            default:
                  ArticlePage.doHighlighting(evt);
                  return;
        }

        if(pgLayout.showRightBar==false){
             rightSidePane.togglePane("workspace");
        }else if(!$("#rightInner h2.ui-state-active").hasClass("workspace")){
             $('#rightInner').accordion("option", "active",".workspace");
        }

        data+=rightSidePane.buildPreviousNextLinks(baseElement,wsObj,wsObjClass);
        data+=exeWS(wsObj,wsObjClass); 

        if(wsObjClass!='authorName') {
            if(wsObjClass=='references' || wsObjClass=='footnote') { selID='b'+selID; }
            if(wsObjClass=='tblFootnote') { selID='ancb'+selID; }
            data+='<ul class="links">';
            if(wsObjClass=='ecomponent'){
              selID = $(wsObj).parent('dl').attr('id');
            }
            data+= '<li><a href="#'+selID+'" class="js_article" onclick="return Outline.findTargetFragment(\''+selID+'\')"><span class="icon viewInArticle_'+SD_UTIL.getProdColor()+'"></span>View in article</a></li>';
//            data+= '<li><a href="#'+selID+'" class="js_article" onclick="return $(\'#centerPane\').moveTo(\''+selID+'\')"><span class="icon viewInArticle_'+SD_UTIL.getProdColor()+'"></span>View in article</a></li>';
            if(wsObjClass=='ecomponent'){
              var obj='';
              obj = $(wsObj).siblings('dd.menuButtonLinks');
              if ($(obj).length>1) { obj = $(wsObj).next('dd.menuButtonLinks'); }
              data+='<li><a href="'+$(obj).find('a.MMCvLINK').attr('href')+'" class="js_article"><span class="icon download_'+SD_UTIL.getProdColor()+'"></span>'+$(obj).find('a.MMCvLINK').text()+'</a></li>';
            }
             data+='</ul>';
        }
        data += '<div id="workSpaceView"></div>';
        $('.js_workspace_content').find('.scrollArea').html(data);

        if ($('.js_workspace_content').find('img.imgLazyJSB')[0]) {
            $.each ($('.js_workspace_content img.imgLazyJSB'), function(){
                var imgEid = $(this).attr('data-inlimgeid');
                if (imgEid != 'undefined' && imgEid != '') {
                    $(this).attr('src', SDM.imageUrlPrefix + $(this).attr('data-inlimgeid'))
                }
            });
        }

        // Make AJAX call to get the abstract for references.
        if (wsObjClass=='references') {
            rightSidePane.populateReferenceLinks (wsObj);
        }

        if (wsObjClass=='authorName' && (SDM.contentType=='JL' || SDM.contentType=='BS')) {
            if ($(wsObj).attr("data-ln") != undefined && $(wsObj).attr("data-fn") != undefined && $(wsObj).attr("data-pos") != undefined && DynamicArtContent.dynamicComponents.scopoutAvail == "Y") {
                var requestObj = new Object();
                var author = new Object();
                author.pos = parseInt($(wsObj).attr("data-pos"));
                author.fn = $(wsObj).attr("data-fn");
                author.ln = $(wsObj).attr("data-ln");
                requestObj.AuthorDetails = author; 
                var requestData = JSON.stringify (requestObj);

                var authUrl = SDM.urlPrefix + '/ScopusAuthorCountsURL/' + SDM.pm.pii;
                var getArticleList=function(res){var json=$.parseJSON(res);rightSidePane.buildArticleList(json, "scopusArticleList", true);};

                $.post (authUrl, {data:requestData}, getArticleList); 
            }
        }

        rightSidePane.animateBackground($('.js_workspace_content').parents('.accordionContent'));
        $('.buttonNavBox  a').unbind('click', rightSidePane.findTargetElement).bind('click', {z:'rightPane'}, rightSidePane.findTargetElement);
        //$('.intra_ref').unbind('click',rightSidePane.findTargetElement).bind('click',rightSidePane.findTargetElement);   
        //if(mathRenderer.opt.renderOn)MathJax.Hub.Queue(["Typeset",MathJax.Hub,$('#rightPane')[0]]);
        if(mathRenderer.opt.renderOn)mathRenderer.handleRerender($('#rightPane'));
        mathRenderer.activateButtons();
    },
    buildPreviousNextLinks:function(baseElement,wsObj,wsObjClass){
      if(Fragment.isAvail()) {return rightSidePane.buildPreviousNextLinksFragment(baseElement,wsObj,wsObjClass);}
      
        var data='';
        var indexVal=$(baseElement).index($(wsObj)[0]);
        var next = $(baseElement).eq(indexVal+1);
        if(indexVal-1>=0){
            var prev = $(baseElement).eq(indexVal-1);
        }
        if(wsObjClass=='references') { wsObjClass='reference'; }
        if(wsObjClass=='authorName') { wsObjClass='author'; }
        if(wsObjClass=='tblFootnote') { wsObjClass='footnote'; }
        if ($(next)[0] || $(prev)[0]) {
            data+='<div aria-label="Go to previous and next in sidebar" role="navigation" class="buttonNavBox">';
            if($(prev).attr("id")){
                data+='  <a href="#'+$(prev).attr("id")+'" class="previous">&laquo; previous '+ wsObjClass +'</a>';
            }
            if($(next).attr("id")){
                data+='  <a href="#'+$(next).attr("id")+'" class="next">next '+ wsObjClass +' &raquo;</a>';
            }
            data+='</div>';
        }
        return data; 
    },
    buildPreviousNextLinksFragment:function(baseElement,wsObj,wsObjClass) {
      var data='';
      var indexVal=$(baseElement).index($(wsObj)[0]);
      var next = Fragment.getNextByType($(wsObj).attr('id'), wsObjClass);
      var prev = Fragment.getPrevByType($(wsObj).attr('id'), wsObjClass);

      DBG.out(1, 'buildPreviousNextLinksFragment()::prev::' + prev + '  current::' + $(wsObj).attr('id') + '  next::' + next);
      if(wsObjClass=='references') { wsObjClass='reference'; }
      if(wsObjClass=='authorName') { wsObjClass='author'; }
      if(wsObjClass=='tblFootnote') { wsObjClass='footnote'; }
      if (next || prev) {
        data+='<div aria-label="Go to previous and next in sidebar" role="navigation" class="buttonNavBox">';
        if(prev){
          data+='  <a href="#'+prev+'" class="previous">&laquo; previous '+ wsObjClass +'</a>';
        }
        if(next){
          data+='  <a href="#'+next+'" class="next">next '+ wsObjClass +' &raquo;</a>';
        }
        data+='</div>';
      }
      return data; 
    },
    populateFigures:function(selObj,selObjClass){
        var data='', imgSrc='';
        if($(selObj).find('dl.figure').length>0){
            $(selObj).find('dl.figure').each(function() {
                imgSrc= $(this).find("img.figure").attr("src");
                data+='<dl class="'+selObjClass+'">';
                if(imgSrc!=undefined)data+= '<dt><img src="'+imgSrc +'" alt="'+ $(this).find("img.figure").attr("alt") +'" class="'+selObjClass+'"></dt>';
                data+= ' <dd>'+$(this).find("dd p").outerHTML() +'</dd>'
                    + '</dl>';
            });
        }else{
            data+='<dl class="'+selObjClass+'">';
            $.each ($(selObj).find("img.figure"), function(){
                imgSrc= $(this).attr("src");
                if(imgSrc!=undefined)data+='<dt><img src="'+imgSrc +'" alt="'+ $(this).attr("alt") +'" class="'+selObjClass+'"></dt>';
            });
            data+= ' <dd>'+$(selObj).find("dd p").outerHTML() +'</dd>'
                + '</dl>';
        }
        return data;  
    },
    populateTables:function(selObj,selObjClass){
        var data='';
        data+='<dl class="'+selObjClass+'">';
        var tblData=$($(selObj).outerHTML());
        $(tblData).find('*[id]').each(function(){
            $(this).removeAttr('id');
        });
        $($(tblData).find('.menuButtonLinks')).remove();
        $($(tblData).find('.fullsizeTable')).remove();
        data+=$(tblData).html();
        data+= '</dl>';
        return data; 
    },
    populateReferences:function(selObj,selObjClass){
        var data='';
        data+='<ol class="'+selObjClass+'">';
        if($(selObj).find("li.author").html()!=null) { data+= '<li class="author">'+ $(selObj).find("li.author").html() +'</li>'; }
        if($(selObj).find("li.title").html()!=null) { data+= '<li class="title">'+ $(selObj).find("li.title").html() +'</li>'; }
        if($(selObj).find("li.source").html()!=null) { data+=' <li class="source">'+$(selObj).find("li.source").html() +'</li>'; }
        data+='<ul class="absPlaceHolder"></ul>';
        data+='<ul class="placeHolder"></ul>'; 
        data+='</ol>';
        return data; 
    },
    populateReferenceLinks:function (selObj) {
        var url='';
        var placeHolderObj = $(selObj).find("li.refPlaceHolder");
        if ($(placeHolderObj).attr("data-refres")=='Y') {
            // Reference has been resolved.
            rightSidePane.getAbstract(placeHolderObj);
            if ($(placeHolderObj).html()!=null) {
                // Add zone & panel for KeyEvents
                var keyEventObj = rightSidePane.addZoneAndPanelForKeyEvents(placeHolderObj);
                var data='';
                data+='<ul class="links">';
                $(keyEventObj).find('div.boxLink').each(function(){
                    var clonedObj = $(this).clone();
                    if($(clonedObj).find('.citedBy_')[0]){
                        var citeObj = $(clonedObj).find('.citedBy_');
                        var workId = "work_" + $(citeObj).attr('id');
                        $(clonedObj).find('.citedBy_').attr('id', workId);
                        // Check whether cited by count is retrieved already
                        if ($(citeObj).attr('data-citeres') == 'Y') {
                             var replacedText = $(citeObj).text().replace(" | ","");
                             $(clonedObj).find('.citedBy_').html(replacedText);
                        } else {
                            rightSidePane.getScopusCitedByCount(placeHolderObj,citeObj);
                        }
                        data+='<li class="refLinks">'+$(clonedObj).outerHTML()+'</li>';
                    } else {
                        data+='<li class="refLinks">'+$(clonedObj).outerHTML()+'</li>';
                    }
                });
                data+='</ul>';
                var wsObj = $('.js_workspace_content').find('.scrollArea');
                var obj = $(wsObj).find("ul.placeHolder");
                $(obj).show();
                $(obj).html(data);
            }
        } else {
            // Reference not resolved. Resolve reference and get abstarct
            rightSidePane.resolveRefsForWorkSpacePanel(placeHolderObj);
        } 
    },
    getAbstract:function(refHolder){
        var absUrl = $(refHolder).attr("data-absUrl");
        if (absUrl == undefined) { return; }
        var ajaxReq = $.get(absUrl, function(response) {
            if (response.length > 1) {
                 var wsObj = $('.js_workspace_content').find('.scrollArea');
                 var obj = $(wsObj).find("ul.absPlaceHolder");
                 $(obj).show();
                 $(obj).html(response);
            }
        });
    },
    addZoneAndPanelForKeyEvents:function(obj) {
        $(obj).find('div.boxLink').each(function(){
            if ($(this).find('a')[0]) {
                // For article url add zone & panel to queryStr
                var anchorTag = $(this).find('a');
                var queryStr = $(anchorTag).attr('queryStr');
                if (queryStr!=undefined) {
                    queryStr += '&_zone=rightPane&panel=workspace';
                    $(anchorTag).attr('queryStr', queryStr);
                } else {
                     var url = $(anchorTag).attr('href');
                     if (url!=undefined) {
                         if (url.indexOf("art_page") != -1) {
                             url = url.replace ("art_page", "rightPane");
                         } else {
                             url += '&zone=rightPane';
                         }
                         url += '&panel=workspace';
                         $(anchorTag).attr('href', url);
                     }
                 }
             }
        });
        return obj; 
    },
    getScopusCitedByCount:function(placeHolderObj,citeObj){
        var citeUrl = '';
        var scEid = $(citeObj).attr("data-sceid");
        var refId = $(placeHolderObj).attr("id");
        if (scEid != undefined && refId != undefined) {
            citeUrl = SDM.urlPrefix + '/citedByScopus/' + scEid + '/' + refId;
        }
        if (citeUrl != '') {
            var ajaxReq = $.get(citeUrl, function(response) {
                if (response) {
                     var wsObj = $('.js_workspace_content').find('.scrollArea');
                     if ($(wsObj).find('.citedBy_')[0]) {
                         $(wsObj).find('.citedBy_').html(response);
                     }
                }
            });
       }
    },
    resolveRefsForWorkSpacePanel:function(placeHolderObj){
        var url = url = SDM.urlPrefix + '/resolveRefs/' + SDM.pm.eid + '/' + $(placeHolderObj).attr("id");
        var data='';
        var wsObj = $('.js_workspace_content').find('.scrollArea');
        var obj = $(wsObj).find("ul.placeHolder");
        if (obj && url) {
            var ajaxReq = $.get(url, function(response) {
                if (response) {
                    var absData = $(response).find('li.refAbs');
                    if ($(absData)[0] ) { data+= $(absData).outerHTML(); }
                    // Add zone & panel for KeyEvents
                    var keyEventObj = rightSidePane.addZoneAndPanelForKeyEvents($(response)); 
                    data+='<ul class="links">';
                    $(keyEventObj).find('div.boxLink').each(function(){
                        data+='<li class="refLinks">'+$(this).html()+'</li>';
                    });
                    data+='<ul>';
                    $(obj).show();
                    $(obj).html(data);
                }
            });
        }
    },   
    populateEcomponents:function(selObj,selObjClass){
        var data='';
        var wsObj = $(selObj).parent('dl');
        var wsObjId = $(selObj).attr('id');
        data+='<dl class="'+selObjClass+'">';
        if ($(wsObj)[0] && wsObjId != 'undefined') {
          data += ' <dd>'+$(wsObj).find('#'+wsObjId).html() +'</dd>';
        }
        if ($(wsObj).find("dd.mmcCaption").html() != null) {
          data += ' <dd>'+$(wsObj).find("dd.mmcCaption").html() +'</dd>';
        }
        data += '</dl>';
        return data; 
    },
    populateAffiliations:function(selObj,selObjClass){
        var data='';
        data+='<ul class="'+selObjClass+'">'
            + '<li>'+ $(selObj).html() +'</li>'
            + '</ul>';
        return data;
    }, 
    populateAuthorInfo:function(selObj,selObjClass){
        var data='';
        var affData='';
        var vitaeData='';
        var authText='';
        data+='<h3>' + $(selObj).closest('li').find('.authorName').text()+'&nbsp;'
            +$(selObj).closest('li').find('.authorDegrees').text()
            + '</h3>'
            +'<dl class="author">';
        if($(selObj).closest('li').find('.authorRoles').text()!=''){
            var roleTxt=$(selObj).closest('li').find('.authorRoles').text();
            data+='<dd><span class="icon blank"></span><p>'
                + roleTxt.substring(2,roleTxt.length-1)
                + '</p></dd>';
        }

        $(selObj).closest('li').find('a').each(function() {
            if($($(this).attr('href')).closest('ul').hasClass('affiliation')){
                affData=$($(this).attr('href')).clone();
                $($(affData).find('sup')).remove();
                data+='<dd><span class="icon affiliation_'+SD_UTIL.getProdColor()+'"></span><p>'
                    + $(affData).html()
                    + '</p></dd>';
            }else if(!$(data).find('.affilData')[0]){
                 data+='<dd class="affilData"><span class="icon affiliation_'+SD_UTIL.getProdColor()+'"></span><p>'
                     + '</p></dd>';
            }
            if($($(this).attr('href')).hasClass('correspondence')){
                data+='<dd><span class="icon correspondence_'+SD_UTIL.getProdColor()+'"></span><p>'
                    + $($(this).attr('href')).find('dd').html()
                    + '</p></dd>';
            }
           if($($(this).attr('href')).hasClass('footnote')){
                data+='<dd><span class="icon blank"></span><p>'
                    + $($(this).attr('href')).find('dd').html()
                    + '</p></dd>';
           }
           if($(this).attr('href').toLowerCase().indexOf('mailto')!=-1){
                data+='<dd><span class="icon email_'+SD_UTIL.getProdColor()+'"></span><p>'
                    + $(this).attr('href').replace('mailto:','')
                    + '</p></dd>';
           }
           if($(this).attr('target')=='externObjLink'){
                var url=$(this).attr('href').substring($(this).attr('href').indexOf('_targetURL')+11,$(this).attr('href').length);
                data+='<dd><span class="icon url"></span><p>'
                    + decodeURIComponent(decodeURIComponent(url))
                    + '</p></dd>';
           }
        });

        data+='</dl>';

        if($(selObj).closest('li').find('.authorVitaeLink')[0]) {
            var vitaeObj=$($(selObj).closest('li').find('.authorVitaeLink').attr('href')).clone();
            var authImg='';
            if($(vitaeObj).find('img')[0]){
                authImg='<div class="authImg">'+$(vitaeObj).find('img').outerHTML()+'</div>';
                $($(vitaeObj).find('img').parent('span')).remove();
            }
            data+='<h3>Vitae</h3>'
                +authImg
                +$(vitaeObj).html();
        }

        // Scoupus Author Info
        data += '<div class="articleList"><ol id="scopusArticleList"></ol></div>';

        if(affData=='' && $(selObj).closest('ul').next('ul.affiliation')[0]){
            var affData=$(selObj).closest('ul').next('ul.affiliation');
            var affOtherData='';
            var affNewData=$('<div>'+data+'</div>').clone();
            if(affData[0] && !$(affData).find('sup')[0]){
               $($(affData).find('sup')).remove();
                affOtherData+='<span class="icon affiliation_'+SD_UTIL.getProdColor()+'"></span><p>'
                    + $(affData).find('li').html()
                    + '</p>';
                $(affNewData).find('.affilData').html(affOtherData);
            }else{
                $(affNewData).find('.affilData').remove();
            }
            data=$(affNewData).html();
        }else{
            var affNewData=$('<div>'+data+'</div>').clone();
            $(affNewData).find('.affilData').remove();
            data=$(affNewData).html();
        }
        return data;  
    },
    populateFootnote:function(selObj,selObjClass){
        var data='';
        if(selObjClass=='footnote'){
            data+='<h3>Footnote '+ $(selObj).find("dt").text() +'</h3>';
            data+='<p>'+ $(selObj).find("dd").html() +'</p>';
        }else{
            data+='<h3>Table footnote '+ $(selObj).find("dt").text() +'</h3>';
            data+='<p>'+ $(selObj).find("dd").html() +'</p>';
        }
        return data; 
    },
    animateBackground:function(obj){
        var rp=$(obj).add($(obj).children('.hidescrollbar'));
        $('div.accordionContent').animate({backgroundColor: pgLayout.glowOnColor},{queue:false,duration:300,complete:function() {
           setTimeout( function() {$('div.accordionContent').stop().animate({backgroundColor: pgLayout.glowOffColor}, {queue:false,duration:100})}, 300);
        }});
    },
    showRightAd:function(obj) {
        var iframe='';
        var rpWidth = $(obj).width();
        var rightAdPH=$(obj).find('.rightAdPlaceHolder');
        $('.rightAdPlaceHolder').html('');
        if (rpWidth <= 300 && SDM.adArticleRightSmURL != "") {
            iframe = '<div id="articleRightAdSm"><iframe scrolling="no" frameborder="0" border="0" cellspacing="0" src="' + SDM.adArticleRightSmURL + '"></iframe></div>';
        }
        else if (rpWidth > 300 && SDM.adArticleRightLgURL != "") {
            iframe = '<div id="articleRightAdLg"><iframe scrolling="no" frameborder="0" border="0" cellspacing="0" src="' + SDM.adArticleRightLgURL + '"></iframe></div>';
        }
        if (rightAdPH[0] && iframe!='') {
            rightAdPH.html(iframe);
        }else if(iframe!=''){
            $(obj).append($('<div class="rightAdPlaceHolder">'+iframe+'</div>'));
        }else{
            rightAdPH.hide();
        }
    }
}
// right pane sidebar code end

// to get the outer html of the selected content
$.fn.outerHTML = function(s) { 
    if (this.length == 0) return false;
    var elem = this[0], name = elem.tagName.toLowerCase();
    if (elem.outerHTML) return elem.outerHTML;
    var attrs = $.map(elem.attributes, function(i) { return i.name+'="'+i.value+'"'; }); 
    return "<"+name+(attrs.length > 0 ? " "+attrs.join(" ") : "")+">"+elem.innerHTML+"</"+name+">";
    //return (s) ? this.before(s).remove() : $("<p>").append($(this.eq(0).clone())).html(); 
} 
// to mimic textoverflow ellipsis feature if not supported by the browser
$.fn.ellipsis = function(){
  var style = document.documentElement.style;
  var hasTextOverflow = ('textOverflow' in style || 'OTextOverflow' in style);
  if(!hasTextOverflow){
    return this.each(function(){
      var element = $(this),                        
      // the clone element we modify to measure the width                         
      clone = element.clone(),                        
      // we save a copy so we can restore it if necessary                        
      originalElement = element.clone(),                        
      originalWidth = element.width(),                        
      reflow = function () { 
          if (originalWidth !== element.width()) {                                
            element.replaceWith(originalElement);                                
            element = originalElement;                                
            originalElement = element.clone();                                
            element.ellipsis();                                
            originalWidth = element.width();
          }                        
      };
      if(element.css("overflow") == "hidden"){
        var text = element.html();
        var multiline = element.hasClass('multiline');
        var t = $(this.cloneNode(true)).hide().css('position', 'absolute').css('overflow', 'visible').width(multiline ? element.width() :'auto').height(multiline ? 'auto' : element.height());
        element.after(t);
        function height() { return t.height() > element.height(); };
        function width() { return t.width() > element.width(); };
        var func = multiline ? height : width;
        while (text.length > 0 && func()){
          text = text.substr(0, text.length - 1);
          t.html(text + "...");
        }
        element.html(t.html());
        t.remove();
      }
      setInterval(reflow, 200);
    });
  }
  else {
    $(this).css({'text-overflow':'ellipsis','overflow':'hidden','white-space':'nowrap'});
  }
}
// NewArt Deux End

//NEWARTDEUXBEGIN TableDownload
var TableDownload = {
  processRequest: function(e) {
    var tableId = $(e.target).closest('dl').attr('id');    
    var table = $("#" + tableId + " dd.table table");
    var lblCap = $("#" + tableId + " dd.lblCap");
    var csvText = "";
    csvText += TableDownload.convertLabelToCSV(lblCap);
    csvText += "\n";
    csvText += TableDownload.convertTableToCSV(table);

    SD_UTIL.sendDownloadKeyEvent('article', 'centerPane', SDM.keOriginContentFamily, 'CSV');

    $('<form action="' + SDM.ep.downloadCsvURL + '"' + ' method="post">' + '<input type="hidden" name="buffer" value="' + csvText.toString() + '" ></form>')
          .appendTo('#articleToolbar').submit().remove();

    return; 
  }, //processRequest

  convertLabelToCSV: function(myLabel) {
    var csvData = [];
    var labelRow = [];
    labelRow[labelRow.length] = TableDownload.cleanCellData($(myLabel).html());
    TableDownload.row2CSV(labelRow, csvData);
    var mydata = csvData.join('\n');
    return mydata;
  },

  convertTableToCSV: function(myTable) {
    var csvData = [];
    myTable.find('thead tr').each(function() {
      var tmpHeadRow = [];
      $(this).find('th').each(function() {
        tmpHeadRow[tmpHeadRow.length] = TableDownload.cleanCellData($(this).html());
      });
      TableDownload.row2CSV(tmpHeadRow, csvData);
    });

    myTable.find('tbody tr').each(function() {
      var tmpRow = [];
      $(this).find('td').each(function() {
        tmpRow[tmpRow.length] = TableDownload.cleanCellData($(this).html());
      });
      TableDownload.row2CSV(tmpRow, csvData);
    });

    var mydata = csvData.join('\n');
    return mydata;
  }, //convertTableToCSV

  row2CSV: function(tmpRow, csvData) {
    var tmp = tmpRow.join('') // to remove any blank rows
    if (tmpRow.length > 0 && tmp != '') {
      var mystr = tmpRow.join(',');
      csvData[csvData.length] = mystr;
    }
  }, //row2CSV

  cleanCellData: function(rawCellData) {
    if(rawCellData.match('mathmlsrc') == null) {
      var cleanCellData = rawCellData.replace(/<img\/?[^>]+(>|$)/g, "&lt;image&gt;");
      cleanCellData = cleanCellData.replace(/<\/?[^>]+(>|$)/g, "");
      cleanCellData = cleanCellData.replace(/[,]/g, "<comma>");  //temporary workaround for comma. 
      cleanCellData = cleanCellData.replace(/&nbsp;/gi, " ");
      cleanCellData = cleanCellData.replace(/&gt;/gi, ">");
      cleanCellData = cleanCellData.replace(/&lt;/gi, "<");
      var regexp = new RegExp(/["]/g); 
      cleanCellData = cleanCellData.replace(regexp, "?");
    } else {
      var cleanCellData = "<MathML>";
    }

    if (cleanCellData.indexOf(",") != -1) {
      cleanCellData = "\"" + cleanCellData + "\"";
    }

    return cleanCellData;
  } //cleanCellData
} //TableDownload
//NEWARTDEUXEND TableDownload

var FigureDownload = {
  processRequest: function(e) {
    SD_UTIL.sendDownloadKeyEvent('article', 'centerPane', SDM.keOriginContentFamily, 'PPT');
  }
}

var GadgetUtil = {
  toolbarIds:["SD_FTA1", "SD_AT1P"],
  displayGadgetCallBack: "",

  loadGadgets:function() {
    SDM.sciverseDecoded=false;
    var gadgetURL = SDM.urlPrefix +'/gadgets/render/'+SDM.pm.pii;
    $.post(gadgetURL,{ JSONString:SDM.sciverseJsonObject }, function(data){
      if(data) {
        try {
          sciverse = decodeURIComponent(decodeURIComponent(data));
          SDM.sciverseDecoded=true;
        }
        catch (err) {
          SDM.sciverseDecoded=false;
        }
      }
      if(SDM.sciverseDecoded==true && sciverse.length>0) {
        prs.rt('svAppLibs_start');
        LazyLoad.js([SDM.ep.svShindigLib, SDM.ep.svSciverseLib], function() {
          GadgetUtil.displayGadgetsWrapper();
          if(SDU.isIE7()) ArticlePage.setPaneWidths();
          prs.rt('svAppLibs_end');
        });
      }
    }); 
  },
  loadGadgetsParallel:function() {
    SDM.sciverseDecoded=false;
    var gadgetURL = SDM.sciverseUrlPfx + "/gadgetservices/rest/getGadgetsData?guid="+SDM.sciverseGadgetDetailsID;
    $.get(gadgetURL, function(data) {
      if (data) {
          sciverse = data;      // no longer decode
      }
      if(sciverse.length>0) {
        prs.rt('svAppLibs_start');
        LazyLoad.js([SDM.ep.svShindigLib, SDM.ep.svSciverseLib], function() {
          GadgetUtil.displayGadgetsWrapper();
          if(SDU.isIE7()) ArticlePage.setPaneWidths();
          prs.rt('svAppLibs_end');
        });
      }
    }, "text");
  },
  displayGadgetsWrapper:function() {
    if(typeof displayGadgets=='function') {
      sgf.subscribeForEvents(sgfEvents.INVOKE_WORKSPACE_VIEW, GadgetUtil.invokeWorkSpaceView);
      sgf.subscribeForEvents(sgfEvents.DISPLAY_GADGET, GadgetUtil.checkForPrivilagedGadget); 
      displayGadgets();
      $('.gadSep').show();
    }
    else {
      setTimeout('GadgetUtil.displayGadgetsWrapper()', 250); 
    } 
  },
  checkForPrivilagedGadget:function(gadgetArray) {
    if (pgLayout.applicationPanelDisplayed) { return; }
    if (gadgetArray != null) {
      $.each (gadgetArray, function() {
        if (this.privFlag == 'Y' && (GadgetUtil.toolbarIds).indexof(this.locationId) > -1) {
          if(!$("#rightInner h2.ui-state-active").hasClass("applications")){
            $('#rightInner').accordion('option', 'active', '.applications');
            rightSidePane.resizeAccordion();
            ArticlePage.setPaneWidths();
          }
          pgLayout.applicationPanelDisplayed = true;
          return false;
        }
      });
    }
  },
  toggleGadgetView:function(obj, boxId, ecompId) {
    if($(obj).hasClass('openMMC')) {
      $(obj).removeClass('openMMC').addClass('closeMMC');
      GadgetUtil.displayGadgetCallBack (boxId, ecompId);
    } else if ($(obj).hasClass('closeMMC')) {
      $(obj).removeClass('closeMMC').addClass('openMMC');
      GadgetUtil.closeGadgetView (boxId);
    }
  },
  closeGadgetView:function (boxId) {
    var ecompObj = $('#'+boxId);
    if (ecompObj) {
      $(ecompObj).find('.containerApplOver').remove();
      $(ecompObj).find('.ecomponent').children().css('display', 'block');
    }
  },
  invokeWorkSpaceView:function() {
    $('.js_workspace_content .scrollArea').html('');
    $('.js_workspace_content .scrollArea').html('<div id="workSpaceView"></div>');
    $('.js_workspace_content #workSpaceView').css('display', 'block');
    if(!$("#rightInner h2.ui-state-active").hasClass("workspace")){
      $('#rightInner').accordion("option", "active",".workspace");
    }
    rightSidePane.animateBackground($('.js_workspace_content').parents('.accordionContent'));
  }   
  
}

Array.prototype.indexof = function(obj){
   for(var i=0; i<this.length; i++){
      if(this[i]==obj){
          return i;
      }
   }
   return -1;
}

/****PPVPROMO - BEGIN***/ 
$(document).ready(function(){
    $('.offerBtn').unbind().bind('click',function(){displayOffer(this);});
});    
function displayOffer(obj){
    if($(obj).next('div.specialOffer')[0]){
        SD_UTIL.sendUserKeyEventForPPV('specialOfferPopup', 'article', 'centerPane');
        $(obj).next('.specialOffer').css('top',$(obj).position().top);
        $(obj).next('.specialOffer').show();
    }else{
        var url = $(obj).attr('data-offerSummary');
        SD_UTIL.sendUserKeyEventForPPV('specialOfferPopup', 'article', 'centerPane');
        $.get(url, function(response) {
            $(obj).parents('.divBlk').append('<div class="specialOffer shadow" style="display: block; right: -16px; top: -41px;"><span class="txtContent"></span><span class="spclose">X</span></div>');
            $(obj).next('.specialOffer').find('.txtContent').html(response);
            $(obj).next('.specialOffer').css('top',$(obj).position().top);
            $(obj).next('.specialOffer').show('fast');
            $(obj).parents('.divBlk').find('.specialOffer').unbind('click').bind('click',function(){hideOffer(this);});
        });
    }
}
function hideOffer(obj){
    $(obj).hide();
}

var SVApi = {
  addMenuItem: function(boxId, ecompId, imageUrl, altText, fnName){
    // gadget framwrk callback to add menuitem

    GadgetUtil.displayGadgetCallBack = fnName;
    var ecompObj = '';
    var boxObj = $('#'+boxId);
    if ($(boxObj).find('dd.ecomponent').length > 1) {
      ecompObj = $('#'+ecompId).next('dd.menuButtonLinks').find('ul.menuButton');
    } else {
      ecompObj = $('#'+boxId).find('ul.menuButton');
    }

    if (ecompObj[0]) {
      var htmlStr = '<li><a class="closeMMC" href="#" onclick=\'GadgetUtil.toggleGadgetView(this,"' + boxId + '","' + ecompId + '");\'><img src="'+imageUrl+'" alt="'+altText+'"></img></a></li>';
      $(ecompObj).append(htmlStr);
    } 
  },
  getCopy: function() {
    var j = jQuery(".svBigBox");
    if (j.length > 0) {                      
      var c = j.clone();
      c.find(".containerApplOver, script, style, link").remove();
      return c.html();
    }
    return null;
  },
  allContentAvail: function(cb, arg1, arg2) {
    cb(arg1, arg2, Fragment.isAllLoaded());
  },
  getCurrentArticleContent: function(cb, arg1, arg2) {
    cb(arg1, arg2, SVApi.getCopy());
  },
  getArticleContent: function(cb, arg1, arg2) {
    if(typeof Fragment == 'object' && Fragment.isAvail()) {
      if(Fragment.isAllLoaded()) {
        cb(arg1, arg2, SVApi.getCopy());
      }
      else {
        Fragment.get('all', null, { successCb:function() {
                                      if(Fragment.all.substr(Fragment.all.length-5)=="ERROR") {
                                        cb(arg1, arg2, null);
                                      }
                                      else {
                                        cb(arg1, arg2, Fragment.all);
                                      }
                                    },
                                    failureCb:function() {
                                      cb(arg1, arg2, null);
                                    }
                                  });
      }
    }
    else {
      cb(arg1, arg2, SVApi.getCopy());
    }
  },
  isAuthorshipClaimedByUser: function(cb, arg1, arg2) {
      $.get(SDM.urlPrefix + "/authAccessGadgetsInfo/" + SDM.webUserId + "/" + SDM.pm.pii, function(response) {
          cb(arg1, arg2, response);
      })
  },
  getEuid: function() {
      return SDM.euidCookieObject; 
  }
};
//MATHJAX
var mathRenderer={
    opt:{
        config:'',
        container:'.mathContainer',
        image:'.mathImg',
        button:'a.mathButton,a.firstFormula',
        renderOn:false
    },
    init:function(){
        this.opt.config = 'MathJax.Hub.Config({' +
            '    skipStartupTypeset: true,'+
            '    displayAlign:"left",'+
            '    config: ["MMLorHTML.js"],' +
            '    elements: ["leftPane","rightPane"],'+
            '    jax: ["input/MathML","output/HTML-CSS","output/SVG","output/NativeMML"],' +
            '    extensions: ["mml2jax.js","MathMenu.js","MathZoom.js"],' +
            '    "HTML-CSS": {'+
            '        linebreaks: { automatic: true},'+
            '        styles: {".MathJax_Display": {"margin": 0}}'+
            '    },'+
            '    "SVG":{linebreaks:{automatic:true}}'+
            '});' +
            'MathJax.Hub.Register.StartupHook("End",function () { '+
            '    $("#centerPane").lazyLoadMathJax({mmlSel:".mathContainer"});  '+
            '    MathJax.Hub.Queue(["Typeset",MathJax.Hub,$("#leftPane")[0]]);'+
            '    MathJax.Hub.Queue(["Typeset",MathJax.Hub,$("#rightPane")[0]]);'+
            '});' +
            'MathJax.Hub.Register.MessageHook("End Math", function(data) {' +
            '    if(data[2]=="Rerender"){mathRenderer.handleRerender($("#centerPane"));}'+
            '    $(data[1]).closest(".mathmlsrc,.formula").find(mathRenderer.opt.image).hide();' +
            '    $(data[1]).closest(".mathmlsrc,.formula").find(mathRenderer.opt.container).css({"visibility":""});'+
            '    $(data[1]).find(mathRenderer.opt.image).hide();' +
            '    mathRenderer.handleError($(data)[1]);' +
            '    mathRenderer.activateButtons();' + 
            '});';
            this.activateButtons();
	    $('body').off('mouseover').on('mouseover',function(e){
		if($(e.target).closest('div.formula > .mathml')[0]){
                    $(mathRenderer.opt.button).not('.firstFormula').removeClass("buttonOn");
		    $(e.target).closest('div.formula > .mathml').find(mathRenderer.opt.button).not('.firstFormula').addClass("buttonOn");
                }else{
		    $(mathRenderer.opt.button).not('.firstFormula').removeClass("buttonOn");
		}
	    });
        },
        activateButtons:function(){
            $('#page-area').off('keydown',this.opt.button).on('keydown',this.opt.button,function(e){
		 if(e.keyCode == 13) {
                     $(this).trigger("click", true);
                     e.preventDefault();
                 }  
	    });
	    $('#page-area').off('mouseover','.formula > .mathml').on('mouseover','.formula .mathml',function(e,keyPress){$(mathRenderer.opt.button).css("display","");});
            $('#page-area').off('click',this.opt.button).on('click',this.opt.button,function(e,keyPress){mathRenderer.toggleButton(e,keyPress);});
	    //$(this.opt.button).css('display','');
        },
        render:function(){
            if(window.MathJax===undefined){
                var script = document.createElement("script");
                script.type = "text/javascript";
                script.src = "//cdn.mathjax.org/mathjax/latest/MathJax.js";
                if (window.opera) {
                    script.innerHTML = this.opt.config;
                } else {
                    script.text = this.opt.config;
                } 
                document.getElementsByTagName("head")[0].appendChild(script);
            }else{
                $(document).lazyLoadMathJax({mmlSel:".mathContainer"});
                mathRenderer.handleRerender($('#leftPane'));
                mathRenderer.handleRerender($('#rightPane'));
            }
        },
        handleRerender:function(obj){
            $(obj).find(mathRenderer.opt.container).each(function(){
                if(!$(this).find('span[class*="MathJax"]')[0]){
                   if($(obj).attr('id')!='centerPane'){
                       MathJax.Hub.Queue(["Typeset",MathJax.Hub,$(this).find('.mathCode')[0]]);
                   }
                }else{
                   if(window.MathJax!=undefined){
                      var tex,script=$(this).find('script')[0];
                      if (window.opera) {
                         tex=script.innerHTML;
                      } else {
                         tex=script.text;
                      }
                      $(script).remove();
                      $(this).find('span[class*="MathJax"]').remove(); 
                      $(this).find('.mathCode').append(tex);
                      MathJax.Hub.Queue(["Typeset",MathJax.Hub,$(this).find('.mathCode')[0]]);
                   } 
               }
            });
        },
        toggleButton:function(e,keyPress){
                if(!keyPress){
		   if($(e.target).hasClass('mathButton') || $(e.target).hasClass('firstFormula')){
	               $(e.target).blur();
                   }else{
		       $(e.target).parent().blur();
		   }
		}
                e.preventDefault();
                e.stopPropagation();
                if(!this.opt.renderOn){
                    this.opt.renderOn=true;
                    $('span[class*="MathJax"]').each(function(){
                        var parentElement=$(this).closest(".mathmlsrc");
                        if(parentElement.closest('.formula')[0]){
                            $(parentElement).find(mathRenderer.opt.container).css({'width':'100%','height':'auto','display':'block'}).removeClass('hidden');
                        }else{
                            $(parentElement).find(mathRenderer.opt.container).css({'width':'auto','height':'auto','display':''}).removeClass('hidden'); 
                        }
                        $(parentElement).find(mathRenderer.opt.image).hide();
                    });
                    this.render();
		    $(this.opt.button).html('Turn<span class="mathjax">&nbsp;</span><span class="offscreen">MathJax </span>off');
                    $(this.opt.button).attr('title', 'Turn MathJax off');
		    $(mathRenderer.opt.container).closest('.formula').find('.scrollOn').removeClass('scrollOn').addClass('scrollOff');
                    mathRenderer.sendMathjaxUserKeyEvent('turnMathJaxOn','article','centerPane',SDM.keOriginContentFamily,SDM.pm.pii);
                }else{  
                    $('span[class*="MathJax"]').each(function(){
                        var parentElement=$(this).closest(".formula,.mathmlsrc");
                        $(parentElement).find(mathRenderer.opt.container).css({"width":"0px","height":"0px"}).addClass('hidden');
                        $(parentElement).find(mathRenderer.opt.image).show();
                    }); 
                    this.opt.renderOn=false;
                    $(this.opt.button).html('Turn<span class="mathjax">&nbsp;</span><span class="offscreen">MathJax </span>on'); 
                    $(this.opt.button).attr('title', 'Turn MathJax on');
                    $('#centerPane').lazyLoadImages({imgSel:'img.imgLazyJSB'});
		    $(mathRenderer.opt.container).closest('.formula').find('.scrollOff').removeClass('scrollOff').addClass('scrollOn');
                    mathRenderer.sendMathjaxUserKeyEvent('turnMathJaxOff','article','centerPane',SDM.keOriginContentFamily,SDM.pm.pii);
                }
                $('.firstFormula').first().removeClass('firstFormula').addClass('mathButton');
                this.activateButtons(); 
		this.handleError();
                $('div.btContainer').replaceWith($('div.btContainer').contents());
                return false;
        },
        handleError:function(obj){
		if($(obj).attr('id')=='leftPane' || $(obj).attr('id')=='rightPane'){
                    if($(obj).find('.formula')[0]){
                        $(obj).find(this.opt.container).css({"height":"auto","width":"100%","display":"block"}).removeClass('hidden');
		    }else{
                        $(obj).find(this.opt.container).css({"height":"auto","width":"auto","display":""}).removeClass('hidden');
                    }
		}else{
                    if($(obj).closest('.formula')[0]){
                        $(obj).closest(this.opt.container).css({"height":"auto","width":"100%","display":"block"}).removeClass('hidden');
                    }else{
                        $(obj).closest(this.opt.container).css({"height":"auto","width":"auto","display":""}).removeClass('hidden');
                    }
		}
                $(".merror").each(function(){
                    $(this).closest(mathRenderer.opt.container).css({"width":"0px","height":"0px"}).addClass('hidden');
                    $(this).closest(mathRenderer.opt.container).siblings(mathRenderer.opt.image).show();
                    $(this).closest(mathRenderer.opt.container).siblings('.mathjax').removeClass('mathjax').hide();
                });
                $(obj).find('span[class*="MathJax"]').each(function(){
                if($(this).text()=="" && !$(this).find('svg')[0]){
                    $(this).closest(mathRenderer.opt.container).css({"width":"0px","height":"0px"}).addClass('hidden');
                    $(this).closest(mathRenderer.opt.container).siblings(mathRenderer.opt.image).show();
                    $(this).closest(mathRenderer.opt.container).siblings('.mathjax').removeClass('mathjax').hide(); 
                }}); 
        },
        sendMathjaxUserKeyEvent:function(a, o, z, ocf, pii){
         //<origin><zone><originContentFamily><activity><articlePii>
         $.get(SDM.userActionURL+'/'+o+'/'+z+'/'+ocf+'/'+a+'/'+pii);
        }
};

$.fn.lazyLoadMathJax = function(opts) {
  var cfg = {
    mmlSel: '',
    preLoadLine: 10
  };
  var lastScrollTop=0;
  function scrollAction() {
    var bottom = $(window).height() + $(document).scrollTop();
    var marginLevel = SDU.isIE7()?700:300;
        if(mathRenderer.opt.renderOn){
            var totalCount=$(cfg.mmlSel).size();
            var loopBool = true;
            if ($('#centerPane').scrollTop() > lastScrollTop){
               var scrollDown=true;
            } else {
               var scrollUp=true;
            }
            for(i=0;i<totalCount && loopBool==true ;i++){
                  var obj = $(cfg.mmlSel)[i]; 
                  var pos = $(obj).positionA('#centerContent'),
                  wX = $('#centerPane').scrollLeft(), wY = $('#centerPane').scrollTop(),
                  wH = $('#centerPane').height(), wW = $('#centerPane').width(),
                  oH = $(obj).closest('.formula,.mathmlsrc').outerHeight(), oW = $(obj).closest('.formula,.mathmlsrc').outerWidth();
                 // check the edges
                 if ((pos.top >= wY && 
                      oH + pos.top <= wY + wH + marginLevel)
                      && !$(obj).find('.MathJax')[0]){
                      if($(obj).closest('.formula')[0]){
                          $(obj).css({'visibility':'hidden','display':'block','width':'100%'});
                      }else{
                          $(obj).css({'visibility':'hidden','display':'','width':'auto'});
                      }
                      MathJax.Hub.Queue(["Typeset",MathJax.Hub,$(obj).find('.mathCode')[0]]);
                 }else{
                      if(pos.top >= wY && oH + pos.top >= wY + wH + marginLevel && scrollDown){
                          loopBool=false;
                      }
                      if(pos.top <= wY && oH + pos.top <= wY + wH + marginLevel && scrollUp){
                          loopBool=false;
                      } 
                 }
             }
             lastScrollTop=$('#centerPane').scrollTop();
        }
  }
 
  return this.each(function() {
    if(opts) {
      $.extend(cfg, opts);
    }
    scrollAction(); // run it once for any images that are currently on the screen
    var lazyScroll = _.debounce(scrollAction, 300);
    $(this).scroll( lazyScroll );
  }) //return
};

jQuery.fn.positionA = function(selector) {
    var left = 0;
    var top = 0;
    this.each(function(index, element) {
        // check if current element has an ancestor matching a selector
        // and that ancestor is positioned
        var $ancestor = $(this).closest(selector);
        if ($ancestor.length && $ancestor.css("position") !== "static") {
            var $child = $(this);
            $child.add($child.parentsUntil($ancestor)).each(function(){
	       var posTop=$(this).position().top;
	       var posLeft=$(this).position().left;
               if(($(this).offsetParent().attr('id')==$ancestor.attr('id') &&
                  (Math.abs(posTop)>0 || Math.abs(posLeft)>0)) || 
                   posTop>$ancestor.height()){
                   left=Math.abs(posLeft);
                   top=Math.abs(posTop); 
               }else{
                   left+=Math.abs(posLeft);
                   top+=Math.abs(posTop);
               }
            });
            return false;
        }
    });
    return {
        left:    left,
        top:    top
    }
};
$.fn.scrollToTopic = function (opts)
{
    var cfg = {
       selTopic: ''
    };
    return this.each(function () {
        if(opts) {
           $.extend(cfg, opts);
        }
        var $scrollContainer = $(this);
        var $topic = $(cfg.selTopic, this);

        if (!$topic.length) return false;

        var vx = $scrollContainer.width();
        var vy = $scrollContainer.height();

        var pos = $topic.position();
        var size = {'width':$topic.outerWidth(),'height':$topic.outerHeight()};

        if (size.width > vx) {
            sl = pos.left;
        } else {
            sl = pos.left + size.width - vx + 16;
        }
        if (size.height > vy) {
            st = pos.top+20;
        } else {
            //st = pos.top + size.height - vy + 16;
	    st = pos.top + size.height - (( vy + 16 ) * 0.8 );
        }
        if (0 > sl) sl = 0;
        if (0 > st) st = 0;

        $scrollContainer.animate({'scrollTop':st, 'scrollLeft':sl});
    });
};

//MRWModule
function loadBreadCrumbs(){
    $.get(SDM.breadCrumbPathURL, function(response) {
        $('.module_topic_paths').html(response);
        $('.module_topic_path').mrwBreadCrumbScroller();
    });
}
/**
 * Scrolling MRWMOD topic on the article page.
 */
$.fn.mrwBreadCrumbScroller = function ()
{
    return this.each(function () {
        var $scrollContainer = $('> div', this).css('overflow', 'hidden'),
            $scrollArea = $scrollContainer.prop('scrollWidth') - $scrollContainer.width(),
            $timePerPixel = 3, // ms
            $recall = false; // Continue scrolling.
        if (0 >= $scrollArea) return;
        $scrollContainer.scrollLeft($scrollArea);

        var $left  = $('<a class="scroll left active" href="#left" title="Scroll to the left"></a>');
        var $right = $('<a class="scroll right deactive" href="#right" title="Scroll to the right"></a>');
        $(this).append($left).append($right);

        function scroller(offset)
        {
            var current = $scrollContainer.scrollLeft();
            var pos = current + offset;

            if (0 >= pos) {
                pos = 0;
                $left.addClass('deactive').removeClass('active');
            } else {
                $left.addClass('active').removeClass('deactive');
            }
            if ($scrollArea < pos) {
                pos = $scrollArea;
                $right.addClass('deactive').removeClass('active');
            } else {
                $right.addClass('active').removeClass('deactive');
            }

            var duration = 1 + $timePerPixel * Math.abs(current - pos);

            $scrollContainer.stop().animate({'scrollLeft':pos}, duration, 'easeOutCirc', function() {
                if ($recall) scroller(offset);
            });

            return false;
        }

        $left.bind('click', function () { return scroller(-300); })
             .bind('mouseenter', function () { $recall = true; return scroller(-10); })
             .bind('mouseleave', function () { $recall = false; return false; });
        $right.bind('click', function () { return scroller(+300); })
              .bind('mouseenter', function () { $recall = true; return scroller(+10); })
              .bind('mouseleave', function () { $recall = false; return false; });
    });
};
//End breadCrumbScroller

var mrwLeftPane={
    currentTab:'',
    init:function(){
        $('#leftPane').prepend('<ul id="lpTabs">'
            + '<li class="leftTab tab" tabindex="0">Subject Browse</li>'
            + '<li class="rightTab tab" tabindex="0">Article Outline</li>'
            + '</ul>');
        $('#lpTabs .leftTab').click(function() {
            mrwLeftPane.showSubject(this);
			SD_UTIL.sendUserKeyEvent('subjectBrowse', 'article', 'leftPane', SDM.keOriginContentFamily);
        });
        $('#lpTabs .rightTab').click(function() {
            mrwLeftPane.showOutline(this);
			SD_UTIL.sendUserKeyEvent('articleOutline', 'article', 'leftPane', SDM.keOriginContentFamily);
        });
        $('#outline, #leftPane, #leftPaneInner').addClass('book');
        $('#outline').prepend(this.load());
        if(SDM.isMRWMODArticle) {
            mrwLeftPane.showSubject($('#lpTabs .leftTab')[0]);
            mrwLeftPane.currentTab='S';
        }
        else {
            mrwLeftPane.showOutline($('#lpTabs .rightTab')[0]);
            mrwLeftPane.currentTab='O';
        }
        $('#leftPaneInner').prepend('<div id="lpTabs" style="background-color:#ECF2F6;height:10px;">&nbsp;</div>');
    },
    load:function(){
        $('body').append('<ul id="srcOutline"></ul>');
        var breadCrumbTreeUrl;
	if (SDM.modsActiveNode != undefined && SDM.modsActiveNode != ''){
	    breadCrumbTreeUrl = SDM.breadCrumbTreeURL + '/concept/' + SDM.modsActiveNode ;
	}else{
	    breadCrumbTreeUrl = SDM.breadCrumbTreeURL ;
	}
        $.get(breadCrumbTreeUrl,function(res){
	    if (res && res.length > 1) {
                $('#srcOutline').append(res).addClass('taxonomy');
                $('ul.taxonomy').tree({
                    'expanded': $('ul.taxonomy a.selected').parents('li')
                });
                $('#srcOutline').show();
		if(!$('ul.taxonomy a.activeNode')[0]){
	            $('#outline').scrollToTopic({selTopic:'ul.taxonomy a.selected'});
		}else{
		    $('#outline').scrollToTopic({selTopic:'ul.taxonomy a.activeNode'});
		}
	        $('#outline').css('overflow-x', 'auto');
            }else{
		$('<div class="subjectMsg"><span class="iconFull infoIcon_yellow">&nbsp;</span><div class="msgTxt">Subject hierarchy temporarily unavailable.</div></div>').appendTo('#srcOutline');
            }
        }).fail(function(){
	    $('<div class="subjectMsg"><span class="iconFull infoIcon_yellow">&nbsp;</span><div class="msgTxt">Subject hierarchy temporarily unavailable.</div></div>').appendTo('#srcOutline');
	});
        return $('#srcOutline');
    },
    showSubject:function(e) {
        $(e).parent().children('.tab').removeClass('activeTab');
        $(e).addClass('activeTab');
        $('.outlineMsg').hide();
        $('#srcOutline').show();
        $('#olGraphCbBox').hide();
        $('#outline.book').css('top', 10);
        $('#itemOutline').hide();
    },
    showOutline:function(e) {
        $(e).parent().children('.tab').removeClass('activeTab');
        $(e).addClass('activeTab');
        $('#itemOutline').show();
        $('.outlineMsg').show();
        $('#srcOutline').hide();
        $('#olGraphCbBox').show();
        if($('#itemOutline').text()!='')$('#outline.book').css('top', 32);
        if($('#outlineGraphicsCheckBox').prop('checked')==true) {
            Outline.toggleGraphics('show');
            $('#outline > ul,#articleLeftAd').css('width', $('#outline').width()-$.scrollBarWidth());
        }
    }
}

// logoutfrom Gigya service
function logoutFromGS() {
	gigya.services.socialize.logout(); 
}

function openPopup(url, windowName, width, height) {
  if ((navigator.appName == "Microsoft Internet Explorer") &&
    (parseFloat(navigator.appVersion) < 4 )) { return false; }
     
  var xOffset=25,yOffset=25;
  var parms = 'width=' + width +
        ',height=' + height +
        ',left=' + xOffset +
        ',top=' + yOffset +
        ',status=no,toolbar=no,menubar=no' +
        ',scrollbars=yes,resizable=yes';
  var displayName = windowName;

  nsWin = window.open(url, displayName, parms);
  nsWin.focus();
  return false;
}

var CollapsibleTextbox = {
  init: function() {
    //If the URL has a fragment, automatically open any collapsed textbox containing that fragment.
    var locHash = window.location.hash;
    if (locHash != 'undefined' && locHash !=''){
        var idSelUnescaped = locHash.substr(1);
        CollapsibleTextbox.openTboxForTarget(idSelUnescaped);
    }
  },
  openTboxForTarget:function(idSelUnescaped){
    var idSel = idSelUnescaped.replace(/[\.]/g, '\\.').replace(/[\:]/g, '\\:');
    var secSegment = $('#'+idSel).parents('*').andSelf().filter(".textboxe-extra, .textboxcollaborative").children(".displayNone");
    if (secSegment) {
       if (secSegment.css("display") == "none"){
         var secImg = $('#'+idSel).parents('*').andSelf().filter(".textboxe-extra, .textboxcollaborative").children(".tbxCollapse");
         secImg.attr("src","/scidirimg/minus.gif");
         secImg.attr("data-inlimg","/minus.gif");
         secSegment.css("display","block");
       }
    }
  }
}


var EReader = {
  init: function() {
    if(SDM.pf.er == undefined) { return; }
    $('#epubLink').attr('href', '');
    $('#epubLink').click(function() {
          DBG.out(1, 'epub clicked');
          EReader.get('epubLink', SDM.pf.er.epub, 0);
          ArticleToolbar.closeOptions();        
          return false;
        });
    $('#mobiLink').attr('href', '');
    $('#mobiLink').click(function() {
          DBG.out(1, 'mobi clicked');
          EReader.get('mobiLink', SDM.pf.er.mobi, 0);
          ArticleToolbar.closeOptions();        
          return false;
        });
  },
  get: function(id, opts, i) {
    var cfg = {
      url: '',
      name: 'unknown',
      retry: 10,
      retryDelay: 2000,
      retryFactor: 1.1
    };
    if(opts) {
      $.extend(true, cfg, opts);
    }
    
    if(i==0) {
      cfg.swStart = new Date();
      EReader.hideLoader($('#' + id), cfg);
      cfg.msgTimeout = setTimeout(function() {
        EReader.showLoader($('#' + id), cfg);
      }, cfg.msgDelay);
    }
    
    $.get(cfg.url)
      .success(function(a,b,c) {
          DBG.out(1, 'The artifact is ready');
          $('#' + id + ' .msg').remove();
          clearTimeout(cfg.msgTimeout);
          EReader.hideLoader($('#' + id), cfg);
        if(a) {
          var artURL = a.split('<url>')[1].split('</url>')[0];
          $('body').append('<iframe style="display:none;" id="ereaderif" src="' + artURL + '"></iframe>');
          cfg.swStop = new Date();
          var diff = cfg.swStop.valueOf() - cfg.swStart.valueOf();
          EReader.hideLoader($('#' + id), cfg);
          DBG.out(1, 'ereader elapsed time:' + diff);
        }
      })
      .error(
        function(a,b,c) {
        if(a.status >=500) {
          window.location.reload();
        }
        else {
          DBG.out(1, 'The artifact is not ready ' + cfg.url);
          if(i < cfg.retry) {
            var d = i * cfg.retryFactor * cfg.retryDelay;
            DBG.out(1, 'delay ' + i + ':' + d);
            setTimeout(function() {EReader.get(id, cfg, ++i)}, d);
          }
          else {
            EReader.errorLoader($('#' + id), cfg);
            cfg.swStop = new Date();
            var diff = cfg.swStop.valueOf() - cfg.swStart.valueOf();
            DBG.out(1, 'ereader gave up after:' + diff);
          }
        }
      });
  },
  showLoader: function($e, cfg) {
    var htmlStr;
    if(cfg.msgType == 'rect') {
      htmlStr = '<div id="ldr' + cfg.name + '" class="erLdr"><div class="msg">Generating ' + cfg.name + '...</div>'
      + '<div class="anim rect facebookG">'
      + '<div id="blockG_1" class="blockG_1 facebook_blockG"></div>'
      + '<div id="blockG_2" class="blockG_2 facebook_blockG"></div>'
      + '<div id="blockG_3" class="blockG_3 facebook_blockG"></div>'
      + '</div></div>';
    }
    $('#erToolbar').append(htmlStr);
  },
  errorLoader: function($e, cfg) {
    if(cfg.msgType == 'rect') {
      $('#ldr' + cfg.name).html('').append('<img class="err" src="/sd/alertIcon.gif"></img>');
      $('#ldr' + cfg.name).append('<div class="msg err">' + cfg.name + ' generation taking longer than expected. Please try later for finished document.</div>');
    }
  },
  fabRequest: function () {
    if (typeof(SDM.fab.mobUrl) != 'undefined') { $.get(SDM.fab.mobUrl); }
  },
  hideLoader: function($e, cfg) {
    $('#ldr' + cfg.name).remove();
    if(!$('.erLdr').length) {
      $('#quickSearch').css('margin-right', '').css('width', '');
      $('div.sdSearch').css('width', '');
    }
  },
  optionsOpened: function() {
     DBG.out(1, 'optionsOpened()');
  },
  optionsClosed: function() {
     DBG.out(1, 'optionsClosed()');  
  }
}
$.fn.ieWarning = function(){
    var container=this;
    init();
    function init(){
        var state = getCookie('ie_warning_state');
        if (state) {
            removeMsg();
        }else{
            showMsg();
        }
    }
    function showMsg(){
        container.show();
        $('.close', container).on('click', disableMsg);
        setTimeout(disableMsg, 20000);
    }
    function hideMsg(){
        container.animate({top:-container.outerHeight()}, removeMsg);
    }
    function disableMsg(){
        createCookie('ie_warning_state', 1);
        hideMsg();
    }
    function removeMsg(){
       container.remove();
    }
};
