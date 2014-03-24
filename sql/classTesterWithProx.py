import re;
import collections;
import string;

from nltk.stem.wordnet import *
plmtzr = WordNetStemmer()

from nltk.corpus import wordnet as wn
from sets import Set

def mywords(filename):
	wordset = collections.defaultdict(lambda: 1)
	with open(filename) as infile:
		for line in infile:
			word=line.strip();
			if len(word)>=3:
				word = plmtzr.lemmatize(word); #Stemming the word
				wordset[word] = 1;
	return list(wordset)

def myfind(tweet, word):
	pos = tweet.find(word);
	if pos != -1 and (tweet[pos-1]==' ' or pos == 0) and ( len(tweet)==pos+len(word) or tweet[pos+len(word)] == ' '  or tweet[pos+len(word)] == '.'):
		return pos;
	else:
		return -1;

def myfindWithPos(tweet, word, start):
	pos = tweet.find(word, start);
	if pos != -1 and (tweet[pos-1]==' ' or pos == 0) and ( len(tweet)==pos+len(word) or tweet[pos+len(word)] == ' '  or tweet[pos+len(word)] == '.'):
		return pos;
	else:
		return -1;
		
def matcher(line, regexp):
	pattern = r'(.*)'+regexp+'( |$)';
	print pattern;
	matchObj = re.match( pattern, line, re.M|re.I)
	if matchObj:
		return 0;
	else:
		return -1;	

#For regular Expression matching
servicePosComb = ["no interrupt", "recharge successful", "free sms alert", "unique internet plan"];
serviceNegComb = ["out of coverage","out of range","too much interrupt", "recharge not successful", "not connect","not connecting", "no internet connection", "no service", "piling the bill","net was off"];
satisfactionPosComb = ["zindabad","start using", "back up service", "backup service"]; #backup service jahan bhi use hota hai is it positive?
satisfactionNegComb = ["never opt for", "time to port","do number portability","technical flawsi"];
miscPos = ["waive","waiving","hive","hiving","bailout","launch","success","bid","implement","discount","bsnl right now"];
miscNeg = ["corruption"];
miscPosComb = ["special tariff vouchers", "sent from aircel update", "dishtv aircel", "extra talk time", "full talk value", "joined force", "fixed the network", "go for bsnl"];
miscNegComb = ["server hacked","killed by govt"];

pricePosVerb = ["decrease","reduce", "reduced", "reduction", "drop", "down", "cheap", "cutter", "less", "low","lowest","slashes", "slashed"];
priceNegVerb = ["increase", "hike", "raise", "raising", "doubled"];
priceAspect = ["rate", "price", "pricing","charge", "tariff"];

servicePosClass1 = ["exclusive", "late", "cheap", "free", "activate","activated", "activating"]; #all positive
servicePosClass2 = ["back","up", ";/", "working", "launch", "launched", "hack", "hacked"];
serviceNegClass1 = ["shittiest", "over", "down","low"]; #all slangs
serviceNegClass2 = ["down","drop", "dropped","lowest","under", "waiting"];
serviceAspect = ["network","speed","call","3g","2g","4g","data pack","gprs","internet","net","wimax","download", "downloaded", "downloading", "coverage","browse","msg","sms","message","delivery","recharge","bill","billing","service"]; 
#better, download

miscPosClass1 = ["new", "revise", "revised","free"];
miscPosClass2 = ["opened", "voucher", "revised", "up"];
miscNegClass1 = ["down", "struggling", "problem in"];
miscNegClass2 = ["down", "hacked", "breached"];
miscAspect    = ['customer care', 'service centre', 'offer', 'pack', 'package', 'plan', 'server', 'service provider', 'tariff', 'web page', 'web site', 'website'];

satisfactionAspect = ["change","changed","changing","port","ported","porting","activated","churning","churned","switch","switched","switching", "mnped", "transfer","moved"];
satisfactionPosC1 = ["to","too","with"];
satisfactionNegC1 = ["from"];
satisfactionPosBi = ["sim activated"];
satisfactionNegBi = ["bye bye"];

neutral = ["dialup", "wire", "landline", "PWD", "riots"];

negation = ["aint", "not", "no", "non", "isnt", "amnt", "arent", "wasnt", "werent", "hasnt", "havent", "hadnt", "never", "willnt", "wouldnt", "maynt", "mightnt", "none", "doesnt", "wont", "cannt", "couldnt", "dont"];
negation += ["ain t", "isn t", "amn t", "aren t", "wasn t", "weren t", "hasn t", "haven t", "hadn t", "willn t", "wouldn t", "mayn t", "mightn t", "doesn t", "won t", "cann t", "couldn t", "don t"];
#"except", "nothing"
POSWORDS = mywords("positive-words.txt")
NEGWORDS = mywords("negative-words.txt")

#~ proxTri = open('proximityTrigram.txt','a+');

def synset(word_list):
	wordset = collections.defaultdict(lambda: 1)
	for word in word_list:
		s = wn.synsets(word)
		for ss in s: #ss is synset
			syn = ss.name.split('.')[0];
			wordset[syn] = 1;
	return list(wordset)
	
def wordCombMatcher(tweet, aspect, positiveWords, negativeWords, isNeg):
	positive_score = 0;		negative_score=0;
	
	for word in positiveWords:
		word = plmtzr.lemmatize(word); #Stemming the word
		if myfind(tweet,word) != -1:
			aspect +=1;
			positive_score += 1;
			#~ if isNeg != []:
				#~ negWithRegExp.write(word+"\t"+tweet+"\n");
			
	for word in negativeWords:
		word = plmtzr.lemmatize(word); #Stemming the word
		if myfind(tweet,word) != -1:
			aspect +=1;
			negative_score+=1;
			#~ if isNeg != []:
				#~ negWithRegExp.write(word+"\t"+tweet+"\n");
	return aspect, positive_score, negative_score
	
def bigramTester(tweet, aspectList, aspect, posWordsB, negWordsB, posWordsA, negWordsA, isNeg, proxmDt):
	#posWordsB : positive words that can come before aspectWords
	#posWordsA : positive words that can come after aspectWords
	positive_score = 0;		negative_score=0;
	
	for word2 in aspectList:
		word2 = plmtzr.lemmatize(word2); #Stemming the word
		pos2 = myfind(tweet,word2);
		if pos2 != -1:
			aspect += 1; #tweet talks about service aspect
			
			for word1 in posWordsB:
				word1 = plmtzr.lemmatize(word1); #Stemming the word
				pos1  = myfind(tweet,word1);
				#Verb occurs before adverb
				if pos1 != -1 and pos2 > pos1:
					wordDist = string.count(tweet," ",pos1+len(word1)-1,pos2);
					if wordDist <= proxmDt:
						if isNeg == []: #Negation does not occur in the tweet
							positive_score += 1;
						else:
							negative_score += 1;
						
			for word1 in negWordsB:
				word1 = plmtzr.lemmatize(word1); #Stemming the word
				pos1  = myfind(tweet,word1);
				#Verb occurs before adverb
				if pos1 != -1 and pos2 > pos1:
					wordDist = string.count(tweet," ",pos1+len(word1)-1,pos2);
					if wordDist <= proxmDt:	
						#~ if isNeg == []: #Negation does not occur in the tweet
						negative_score += 1;
						#~ else:
							#~ positive_score += 1;
			
			for word1 in posWordsA:
				word1 = plmtzr.lemmatize(word1); #Stemming the word
				pos1  = myfind(tweet,word1);
				#Verb occurs after adverb
				if pos1 != -1 and pos2 < pos1:
					wordDist = string.count(tweet," ",pos2+len(word2)-1,pos1);
					if wordDist <= proxmDt:	
						if isNeg == []: #Negation does not occur in the tweet
							#~ print word1+" "+word2;
							positive_score += 1;
						else:
							negative_score += 1;
						
			for word1 in negWordsA:
				word1 = plmtzr.lemmatize(word1); #Stemming the word
				pos1  = myfind(tweet,word1);
				#Verb occurs after adverb
				if pos1 != -1 and pos2 < pos1:
					wordDist = string.count(tweet," ",pos2+len(word2)-1,pos1);
					if wordDist <= proxmDt:		
						#~ if isNeg == []: #Negation does not occur in the tweet
						negative_score += 1;
						#~ else:
							#~ positive_score += 1;		
							
	return aspect, positive_score, negative_score			

def trigramTester(tweet, aspect, satisfactionAspect, satisfactionPosC1, satisfactionNegC1, service_provider, isNeg, other_service_provider):
	positive_score = 0;		negative_score=0;
	
	for word1 in satisfactionAspect:
		word1 = plmtzr.lemmatize(word1); #Stemming the word
		pos1  = myfind(tweet,word1);
		
		if pos1 != -1:
			aspect += 1; #tweet talks about satisfaction aspect
			
			for word2 in satisfactionPosC1:
				word2 = plmtzr.lemmatize(word2); #Stemming the word
				pos2 = myfindWithPos(tweet,word2, pos1); #Start searching after position pos1
				if pos2 != -1:
					wordDist1 = 0; wordDist2 = 0;
					for word3 in service_provider:
						word3 = plmtzr.lemmatize(word3); #Stemming the word
						pos3  = myfindWithPos(tweet,word3, pos2);
						if pos3 != -1:
							wordDist1 = string.count(tweet," ",pos2+len(word2)-1,pos3);
					
					wordDist = []
					for word3 in other_service_provider:
						word3 = plmtzr.lemmatize(word3); #Stemming the word
						pos3  = myfindWithPos(tweet,word3, pos2);
						if pos3 != -1:
							wordDist = wordDist + [string.count(tweet," ",pos2+len(word2)-1,pos3)];
					
					if wordDist != []:
						wordDist2 = min(wordDist);

					if wordDist1 != 0 and wordDist2 != 0:
						if wordDist1 < wordDist2:
							positive_score += 1;
						else:
							negative_score += 1;
					if wordDist1 == 0 and wordDist2 > 0:
						negative_score += 1;
					if wordDist2 == 0 and wordDist1 > 0:
						positive_score += 1;	
					
			for word2 in satisfactionNegC1:
				word2 = plmtzr.lemmatize(word2); #Stemming the word
				pos2  = myfindWithPos(tweet,word2, pos1);
				if pos2 != -1:
					wordDist1 = 0; wordDist2 = 0;
					for word3 in service_provider:
						word3 = plmtzr.lemmatize(word3); #Stemming the word
						pos3  = myfindWithPos(tweet,word3, pos2);
						if pos3 != -1:
							wordDist1 = string.count(tweet," ",pos2+len(word2)-1,pos3);	
					
					wordDist = []
					for word3 in other_service_provider:
						word3 = plmtzr.lemmatize(word3); #Stemming the word
						pos3  = myfindWithPos(tweet,word3, pos2);
						if pos3 != -1:
							wordDist = wordDist + [string.count(tweet," ",pos2+len(word2)-1,pos3)];
					
					if wordDist != []:
						wordDist2 = min(wordDist);
		
					if wordDist1 != 0 and wordDist2 != 0:
						if wordDist1 < wordDist2:
							negative_score += 1;
						else:
							positive_score += 1;
					if wordDist1 == 0 and wordDist2 > 0:
						positive_score += 1;
					if wordDist2 == 0 and wordDist1 > 0:
						negative_score += 1;	
	
	return aspect, positive_score, negative_score											

def unigramTester(tweet, aspectList, posWordList, negWordList,isNeg):
	positive_score = 0;		negative_score=0;
	
	isAspect = [ x for x in aspectList if myfind(tweet,x) != -1];
	
	if isAspect == []:		
		posWordFound = 0;	negWordFound = 0;
		
		for word in posWordList:
			word = plmtzr.lemmatize(word); #Stemming the word
			pos  = myfind(tweet,word);
			if pos != -1:
				if isNeg == []:
					posWordFound = posWordFound + 1;
				else:
					negWordFound = negWordFound + 1;	
			
		for word in negWordList:
			word = plmtzr.lemmatize(word); #Stemming the word
			pos  = myfind(tweet,word);
			if pos != -1:
				#~ if isNeg == []:
				negWordFound = negWordFound + 1;
				#~ else:
					#~ posWordFound = posWordFound + 1;
		
		if posWordFound > 0:
			positive_score += posWordFound;
			
		if negWordFound > 0:
			negative_score += negWordFound;
				
	return positive_score, negative_score
	
#def regExpMatcher(tweet, posRegExp, negRegExp):
	#net(.*)off,
									
def classifier(tweet, service_provider):
	positive_score = 0;		negative_score=0;		neutral_score=0;
	isPrice=0;		isService=0;		isSatis=0;		isMisc=0;
		
	#Check for neutral
	for word in neutral:
		word = plmtzr.lemmatize(word); #Stemming the word
		pos  = myfind(tweet,word);
		
		if pos != -1:
			neutral_score == 1;	
	
	if neutral_score != 1:				
		proxmDt = 100;
		isNeg = [ x for x in negation if myfind(tweet,x) != -1];
		all_service_provider = ["bsnl", "mtnl", "aircel", "airtel", "vodafone", "idea", "docommo", "docomo", "indicom", "MTS", "virgin", "reliance", "uninor", "loop", "videocon"];
		other_service_provid = [x for x in all_service_provider if x != service_provider.lower()];
		
		#Check for price aspect
		isPrice,   positive_scoreP, negative_scoreP = bigramTester(tweet, priceAspect, isPrice, pricePosVerb+POSWORDS, priceNegVerb+NEGWORDS, pricePosVerb+POSWORDS, priceNegVerb+NEGWORDS, isNeg, proxmDt);
		
		#Check for service aspect
		isService1, positive_scoreS1, negative_scoreS1 = bigramTester(tweet, serviceAspect, isService, servicePosClass1+POSWORDS, serviceNegClass1+NEGWORDS, servicePosClass2+POSWORDS, serviceNegClass2+NEGWORDS, isNeg, proxmDt);
		isService,  positive_scoreS2, negative_scoreS2 = wordCombMatcher(tweet, isService1, servicePosComb, serviceNegComb, isNeg);

		#Check for satisfaction aspect
		isSatis1, positive_scoreSa1, negative_scoreSa1 = trigramTester(tweet, isSatis, satisfactionAspect, satisfactionPosC1, satisfactionNegC1, [service_provider], isNeg, other_service_provid);
		isSatis2, positive_scoreSa2, negative_scoreSa2 = wordCombMatcher(tweet, isSatis1, satisfactionPosComb, satisfactionNegComb, isNeg);
		isSatis , positive_scoreSa3, negative_scoreSa3 = bigramTester(tweet, service_provider, isSatis2, satisfactionPosBi, satisfactionNegBi, satisfactionPosBi, satisfactionNegBi, [], 1);
		isSatis , negative_scoreSa4, positive_scoreSa4 = bigramTester(tweet, other_service_provid, isSatis2, satisfactionPosBi, satisfactionNegBi, satisfactionPosBi, satisfactionNegBi, [], 1);
		
		#Check for miscellaneous aspect
		isMisc1, positive_scoreM1, negative_scoreM1 = wordCombMatcher(tweet, isMisc, miscPos, miscNeg, isNeg);
		isMisc2, positive_scoreM2, negative_scoreM2 = bigramTester(tweet, miscAspect, isMisc1, miscPosClass1+POSWORDS, miscNegClass1+NEGWORDS, miscPosClass2+POSWORDS, miscNegClass2+NEGWORDS, isNeg, proxmDt);
		isMisc,  positive_scoreM,  negative_scoreM  = wordCombMatcher(tweet, isMisc2, miscPosComb, miscNegComb, isNeg);
		
		#Pos Pos match with no match of aspect
		positive_scoreG, negative_scoreG = unigramTester(tweet, priceAspect+serviceAspect+satisfactionAspect+miscAspect, POSWORDS, NEGWORDS, isNeg);
		
		#Accumlated positive or negative score
		positive_score = positive_scoreP + positive_scoreS1 + positive_scoreS2 + positive_scoreSa1 + positive_scoreSa2 + positive_scoreSa3 + positive_scoreSa4 + positive_scoreM + positive_scoreM1 + positive_scoreM2 + positive_scoreG;
		negative_score = negative_scoreP + negative_scoreS1 + negative_scoreS2 + negative_scoreSa1 + negative_scoreSa2 + negative_scoreSa3 + negative_scoreSa4 + negative_scoreM + negative_scoreM1 + negative_scoreM2 + negative_scoreG;
		
	return positive_score, negative_score, neutral_score, isPrice, isService, isSatis, isMisc

str1 = "@ sunilmittal365 its been 2days ported from bsnl to airtel still my number 9936102214 isnt active local vendor at kanpur has messed it "
positive_score, negative_score, neutral_score, isPrice, isService, isSatis, isMisc = classifier(str1,"bsnl");
print str(positive_score) + " " + str(negative_score) + " " + str(neutral_score) + " " + str(isPrice) + " " + str(isService) + " " + str(isSatis) + " " + str(isMisc)
