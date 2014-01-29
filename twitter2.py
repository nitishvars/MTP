# http://en.wikipedia.org/w/api.php?format=json&action=query&titles=Main%20Page&prop=revisions&rvprop=content
import json
import urllib

#api_key = open(".api_key").read()
#query = "select * from contentanalysis.analyze where text = \'Italian sculptors and painters of the renaissance favored the Virgin Mary for inspiration.\'"
#print query
#http://en.wikipedia.org/w/api.php?action=query&titles=Federal&prop=info&inprop=url&format=jsonfm
service_url = 'http://otter.topsy.com/search.json'
params = {
        'q':'vodafone',
	'apikey':'09C43A9B270A470B8EB8F2946A9369F3',
	'maxtime':'1346371200',
	'mintime':'1343692800'
}
url = service_url + '?' + urllib.urlencode(params)
proxies = {'http': 'http://10.10.78.62:3128'}
#url="http://otter.topsy.com/search.json?q=docomo&mintime=1343692800&maxtime=1343701440&apikey=FNOH4G3UYYRQ3TXBQ4MAAAAAACV2RC2NJBJAAAAAAAAFQGYA&perpage=1000"
print url
result=urllib.urlopen(url,proxies=proxies).read();
#print result
response = json.loads(result)
#'''for result in response['query']:
#	print result['count']+ ' (' + result['created'] + ')''''
#print response['query']['pages']['-1']['fullurl']
for result in response['response']['list']:
	print result['hits']
	print result['title']
	print result['content']
	
	#print response['query']['pages'][result]['fullurl'];#+ ' (' + result['editurl'] + ')'


'''for key, value in response['query'].iteritems():
	print key, value
	if(key==u'fullurl'):
		url=value
		print 'URL:%s'%url
'''

