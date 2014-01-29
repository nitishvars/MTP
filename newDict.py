#Builds a dictonary of words that are not in dictonary dataset provided by wordnet20-from-prolog-all-3.sql

import re, collections

def words(text): return re.findall('[a-z]+', text.lower()) 
def train(features1, features2):
    model1 = collections.defaultdict(lambda: 1)
    for f in features1:
        model1[f] += 1
    
    model2 = collections.defaultdict(lambda: 1)
    for f in features2:
		if model1[f] <= 1:
			    model2[f] += 1
    sorted_keys = sorted(model2.keys())  
    return sorted_keys

myfile = open('internet lingo.txt','w'); 
for key in train(words(file('dict.txt').read()), words(file('twitter/BSNL/28-02-2013/details').read())):
	myfile.write(key+"\n");

