import re;
import collections;

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
			
pricePosVerb = ["decrease","reduce", "reduced", "reduction", "drop", "down", "cheap", "cutter", "less", "low", "slashes", "slashed"];
priceNegVerb = ["increase", "hike", "raise", "raising", "doubled"];
priceAspect = ["rate", "price", "pricing","charge", "tariff"];

serviceNegClass1 = ["shittiest", "over", "down"]; #all slangs
serviceNegClass2 = ["down","drop", "dropped", "under", "waiting"];
serviceNegComb = ["out of coverage","out of range","too much interrupt", "recharge not successful", "not connecting", "no internet connection", "no service"];

servicePosClass1 = ["exclusive", "late", "cheap", "free"]; #all positive
servicePosClass2 = ["back","up", ";/", "working", "launch", "launched", "hack", "hacked"];
servicePosComb = ["no interrupt", "recharge successful", "free sms alert"];

serviceAspect = ["network","speed","call","3g","2g","4g","gprs","internet","net", "download", "downloaded", "downloading", "coverage","browse","msg","sms","message","delivery","recharge","bill","billing"]; 
#billing (piling bill), better, download

miscPos = ["waive","waiving","hive","hiving","bailout","launch","success","bid","implement","discount","offer","bsnl right now"];
miscNeg = ["corruption"];
miscPosClass1 = ["new", "revise", "revised"];
miscPosClass2 = ["opened", "voucher", "revised"];
miscNegClass1 = ["down", "struggling", "problem in"];
miscNegClass2 = ["down", "hacked", "breached"];
miscAspect    = ["customer service centre", "customer care", "service provider", "website", "web site", "tariff", "plan", "pack", "package", "server"];
miscPosComb = ["special tariff vouchers", "sent from aircel update", "dishtv aircel", "extra talk time", "unique internet plan", "full talk value", "joined force", "fixed the network"];
miscNegComb = ["server hacked"];

satisfactionAspect = ["change","changed","port","ported","activated","churned","switched", "switching", "mnped"];
satisfactionPosC1 = ["to","too"];
satisfactionNegC1 = ["from"];

satisfactionPosComb = ["zindabad","start using", "back up service", "backup service", "bsnl sim activated"]; #backup service jahan bhi use hota hai is it positive?
satisfactionNegComb = ["never opt for"];

neutral = ["dialup", "wire", "landline", "PWD"];

negation = ["not", "no", "non", "isnt", "amnt", "arent", "wasnt", "werent", "hasnt", "havent", "hadnt", "never", "willnt", "wouldnt", "maynt", "mightnt", "none", "doesnt", "wont", "cannt", "couldnt", "dont"];
negation += ["isn t", "amn t", "aren t", "wasn t", "weren t", "hasn t", "haven t", "hadn t", "willn t", "wouldn t", "mayn t", "mightn t", "doesn t", "won t", "cann t", "couldn t", "don t"];
#"except", "nothing"
POSWORDS = mywords("positive-words.txt")
NEGWORDS = mywords("negative-words.txt")

negneg = 0;
neg_file = open('negneg.txt','a+');

def synset(word_list):
	wordset = collections.defaultdict(lambda: 1)
	for word in word_list:
		s = wn.synsets(word)
		for ss in s: #ss is synset
			syn = ss.name.split('.')[0];
			wordset[syn] = 1;
	return list(wordset)
	
def unigramTester(tweet, aspect, positiveWords, negativeWords, isNeg):
	positive_score = 0;		negative_score=0;
	
	for word in positiveWords:
		word = plmtzr.lemmatize(word); #Stemming the word
		pos = tweet.find(word);
		if pos != -1 and (tweet[pos-1]==' ' or pos == 0) and ( len(tweet)==pos+len(word) or tweet[pos+len(word)] == ' ' or tweet[pos+len(word)] == '.' ):
			aspect +=1;
			positive_score += 1;
			
	for word in negativeWords:
		word = plmtzr.lemmatize(word); #Stemming the word
		pos = tweet.find(word);
		if pos != -1 and (tweet[pos-1]==' ' or pos == 0) and ( len(tweet)==pos+len(word) or tweet[pos+len(word)] == ' ' or tweet[pos+len(word)] == '.' ):
			aspect +=1;
			negative_score+=1;
	return aspect, positive_score, negative_score
	
def bigramTester(tweet, aspectList, aspect, posWordsB, negWordsB, posWordsA, negWordsA, isNeg):
	#posWordsB : positive words that can come before aspectWords
	#posWordsA : positive words that can come after aspectWords
	positive_score = 0;		negative_score=0;
	negneg = 0;
	
	for word2 in aspectList:
		word2 = plmtzr.lemmatize(word2); #Stemming the word
		pos2 = tweet.find(word2);
		if pos2 != -1 and (tweet[pos2-1]==' ' or pos2 == 0) and (len(tweet)==pos2+len(word2) or tweet[pos2+len(word2)] == ' ' or tweet[pos2+len(word2)] == '.' ):
			aspect += 1; #tweet talks about service aspect
			
			for word1 in posWordsB:
				word1 = plmtzr.lemmatize(word1); #Stemming the word
				pos1 = tweet.find(word1);
				#Verb occurs before adverb
				if pos2 > pos1 and pos1 != -1 and ( tweet[pos1-1]==' ' or pos1 == 0) and ( len(tweet)==pos1+len(word1) or tweet[pos1+len(word1)] == ' ' or tweet[pos1+len(word1)] == '.' ): 
					#~ print word1
					if isNeg == []: #Negation does not occur in the tweet
						positive_score += 1;
					else:
						negative_score += 1;
						
			for word1 in negWordsB:
				word1 = plmtzr.lemmatize(word1); #Stemming the word
				pos1 = tweet.find(word1);
				#Verb occurs before adverb
				if pos2 > pos1 and pos1 != -1 and ( tweet[pos1-1]==' ' or pos1 == 0) and ( len(tweet)==pos1+len(word1) or tweet[pos1+len(word1)] == ' ' or tweet[pos1+len(word1)] == '.'): 
					if isNeg == []: #Negation does not occur in the tweet
						#~ print word1;
						negative_score += 1;
					else:
						negneg=1;
						#~ positive_score += 1;
			
			for word1 in posWordsA:
				word1 = plmtzr.lemmatize(word1); #Stemming the word
				pos1 = tweet.find(word1);
				#Verb occurs after adverb
				if pos2 < pos1 and tweet[pos1-1]==' ' and ( len(tweet)==pos1+len(word1) or tweet[pos1+len(word1)] == ' ' or tweet[pos1+len(word1)] == '.'):
					if isNeg == []: #Negation does not occur in the tweet
						#~ print word1+" "+word2;
						positive_score += 1;
					else:
						negative_score += 1;
						
			for word1 in negWordsA:
				word1 = plmtzr.lemmatize(word1); #Stemming the word
				pos1 = tweet.find(word1);
				#Verb occurs after adverb
				if pos2 < pos1 and tweet[pos1-1]==' ' and ( len(tweet)==pos1+len(word1) or tweet[pos1+len(word1)] == ' ' or tweet[pos1+len(word1)] == '.'):
					if isNeg == []: #Negation does not occur in the tweet
						#~ print word1;
						negative_score += 1;
					else:
						negneg=1;
						#~ positive_score += 1;		
							
	return aspect, positive_score, negative_score, negneg			

def trigramTester(tweet, aspect, satisfactionAspect, satisfactionPosC1, satisfactionNegC1, service_provider, isNeg, other_service_provider):
	positive_score = 0;		negative_score=0;
	
	for word1 in satisfactionAspect:
		word1 = plmtzr.lemmatize(word1); #Stemming the word
		pos1  = tweet.find(word1);
		
		if pos1 != -1 and (tweet[pos1-1]==' ' or pos1 == 0) and ( len(tweet)==pos1+len(word1) or tweet[pos1+len(word1)] == ' ' or tweet[pos1+len(word1)] == '.'):
			aspect += 1; #tweet talks about satisfaction aspect
			
			for word2 in satisfactionPosC1:
				word2 = plmtzr.lemmatize(word2); #Stemming the word
				pos2  = tweet.find(word2);
				if pos2 > pos1 and tweet[pos2-1]==' ' and ( len(tweet)==pos2+len(word2) or tweet[pos2+len(word2)] == ' ' or tweet[pos2+len(word2)] == '.'):
					for word3 in service_provider:
						word3 = plmtzr.lemmatize(word3); #Stemming the word
						pos3  = tweet.find(word3);
						if pos3 > pos2 and tweet[pos3-1]==' ' and ( len(tweet)==pos3+len(word3) or tweet[pos3+len(word3)] == ' ' or tweet[pos3+len(word3)] == '.'):
							if isNeg == []: #Negation does not occur in the tweet
								positive_score += 1;
							else:
								negative_score += 1;
								
					for word3 in other_service_provider:
						word3 = plmtzr.lemmatize(word3); #Stemming the word
						pos3  = tweet.find(word3);
						if pos3 > pos2 and tweet[pos3-1]==' ' and ( len(tweet)==pos3+len(word3) or tweet[pos3+len(word3)] == ' ' or tweet[pos3+len(word3)] == '.'):
							if isNeg == []: #Negation does not occur in the tweet
								negative_score += 1;
							else:
								positive_score += 1;
										
			for word2 in satisfactionNegC1:
				word2 = plmtzr.lemmatize(word2); #Stemming the word
				pos2  = tweet.find(word2);
				if pos2 > pos1 and tweet[pos2-1]==' ' and ( len(tweet)==pos2+len(word2) or tweet[pos2+len(word2)] == ' ' or tweet[pos2+len(word2)] == '.'):
					for word3 in service_provider:
						word3 = plmtzr.lemmatize(word3); #Stemming the word
						pos3  = tweet.find(word3);
						if pos3 > pos2 and tweet[pos3-1]==' ' and ( len(tweet)==pos3+len(word3) or tweet[pos3+len(word3)] == ' ' or tweet[pos3+len(word3)] == '.'):
							if isNeg == -1: #Negation does not occur in the tweet
								negative_score += 1;
							else:
								positive_score += 1;
					
					for word3 in other_service_provider:
						word3 = plmtzr.lemmatize(word3); #Stemming the word
						pos3  = tweet.find(word3);
						if pos3 > pos2 and tweet[pos3-1]==' ' and ( len(tweet)==pos3+len(word3) or tweet[pos3+len(word3)] == ' ' or tweet[pos3+len(word3)] == '.'):
							if isNeg == -1: #Negation does not occur in the tweet
								positive_score += 1;
							else:
								negative_score += 1;			
	return aspect, positive_score, negative_score													
							
def classifier(tweet, service_provider):
	positive_score = 0;		negative_score=0;		neutral_score=0;
	isPrice=0;		isService=0;		isSatis=0;		isMisc=0;
	
	negneg = 0; #Remove
	
	isNeg = [ x for x in negation if myfind(tweet,x) != -1];
	all_service_provider = ["bsnl", "mtnl", "aircel", "airtel", "vodafone", "idea", "docommo", "docomo", "indicom", "MTS", "virgin", "reliance", "uninor", "loop", "videocon"];
	other_service_provid = [x for x in all_service_provider if x != service_provider.lower()];
	
	#Check for price aspect
	isPrice,   positive_scoreP, negative_scoreP, negneg1 = bigramTester(tweet, priceAspect, isPrice, pricePosVerb+POSWORDS, priceNegVerb+NEGWORDS, pricePosVerb+POSWORDS, priceNegVerb+NEGWORDS, isNeg);
	
	#Check for service aspect
	isService1, positive_scoreS1, negative_scoreS1, negneg2 = bigramTester(tweet, serviceAspect + [service_provider], isService, servicePosClass1+POSWORDS, serviceNegClass1+NEGWORDS, servicePosClass2+POSWORDS, serviceNegClass2+NEGWORDS, isNeg);
	isService,  positive_scoreS2, negative_scoreS2 = unigramTester(tweet, isService1, servicePosComb, serviceNegComb, isNeg);

	#Check for satisfaction aspect
	isSatis1, positive_scoreSa1, negative_scoreSa1 = trigramTester(tweet, isSatis, satisfactionAspect, satisfactionPosC1, satisfactionNegC1, [service_provider], isNeg, other_service_provid);
	isSatis,  positive_scoreSa2, negative_scoreSa2 = unigramTester(tweet, isSatis1, satisfactionPosComb, satisfactionNegComb, isNeg);
	
	#Check for miscellaneous aspect
	isMisc1, positive_scoreM1, negative_scoreM1 = unigramTester(tweet, isMisc, miscPos, miscNeg, isNeg);
	isMisc2, positive_scoreM2, negative_scoreM2, negneg3 = bigramTester(tweet, miscAspect, isMisc1, miscPosClass1+POSWORDS, miscNegClass1+NEGWORDS, miscPosClass2+POSWORDS, miscNegClass2+NEGWORDS, isNeg);
	isMisc,  positive_scoreM,  negative_scoreM  = unigramTester(tweet, isMisc2, miscPosComb, miscNegComb, isNeg);
	
	#Accumlated positive or negative score
	positive_score = positive_scoreP + positive_scoreS1 + positive_scoreS2 + positive_scoreSa1 + positive_scoreSa2 + positive_scoreM + positive_scoreM1 + positive_scoreM2;
	negative_score = negative_scoreP + negative_scoreS1 + negative_scoreS2 + negative_scoreSa1 + negative_scoreSa2 + negative_scoreM + negative_scoreM1 + negative_scoreM2;
	negneg = negneg1 + negneg2 + negneg3;
	
	#Check for neutral
	for word in neutral:
		word = plmtzr.lemmatize(word); #Stemming the word
		pos  = tweet.find(word);
		
		if pos != -1:
			neutral_score += 1;	
	
	if negneg >= 1:
		neg_file.write(tweet + "\n");
		
	return positive_score, negative_score, neutral_score, isPrice, isService, isSatis, isMisc

str1 = "do you want to try bsnl i have my earlier sim which i am not using now also i have t24 which uses tata docomo network"
positive_score, negative_score, neutral_score, isPrice, isService, isSatis, isMisc = classifier(str1,"bsnl");
print str(positive_score) + " " + str(negative_score) + " " + str(neutral_score) + " " + str(isPrice) + " " + str(isService) + " " + str(isSatis) + " " + str(isMisc)
