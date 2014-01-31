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
	
pricePosVerb = ["decrease","reduction", "drop", "down", "cheap", "cutter"];
priceNegVerb = ["increase", "hike"];
priceAspect = ["rate", "price"];

serviceNegClass1 = ["shittiest", "over"]; #all slangs
serviceNegClass2 = ["down","drop", "under", "waiting"];
serviceNegComb = ["out of coverage","too much interrupt", "recharge not successful", "always good"];

servicePosClass1 = ["exclusive","late","cheap", "new"]; #all positive
servicePosClass2 = ["back","up", ";/", "working", "launch", "launched"];
servicePosComb = ["no interrupt", "recharge successful"];

serviceAspect = ["network","speed","call","3g","2g","gprs","internet","mobile net", "coverage","browse","msg","message","delivery","plan","recharge", "bill", "billing"]; 
#billing (piling bill)

miscPos = ["waive","hive","bailout","launch","success","bid","implement","discount","offer"];
miscNeg = ["corruption"];
miscPosClass1 = [];
miscPosClass2 = ["opened"];
miscNegClass1 = ["down", "struggling"];
miscNegClass2 = ["down", "hacked"];
miscAspect    = ["customer service centre", "customer care", "website"];
miscPosComb = [];
miscNegComb = ["server hacked"];

satisfactionAspect = ["change","port","activated","churned"];
satisfactionPosC1 = ["to","too"];
satisfactionNegC1 = ["from"];

satisfactionPosComb = ["zindabad","start using"];
satisfactionNegComb = [];

neutral = ["dialup", "wire", "landline", "PWD"];

negation = ["not", " no ", "isnt", "amnt", "arent", "wasnt", "werent", "hasnt", "havent", "hadnt", "never", "willnt", "wouldnt", "maynt", "mightnt", "none", "doesnt", "wont", "cannt", "couldnt", "dont"];
negation += ["isn t", "amn t", "aren t", "wasn t", "weren t", "hasn t", "haven t", "hadn t", "willn t", "wouldn t", "mayn t", "mightn t", "doesn t", "won t", "cann t", "couldn t", "don t"];
#"except"
POSWORDS = mywords("positive-words.txt")
NEGWORDS = mywords("negative-words.txt")

def synset(word_list):
	wordset = collections.defaultdict(lambda: 1)
	for word in word_list:
		s = wn.synsets(word)
		for ss in s: #ss is synset
			syn = ss.name.split('.')[0];
			wordset[syn] = 1;
	return list(wordset)
	
def unigramTester(tweet, aspect, positiveWords, negativeWords):
	positive_score = 0;		negative_score=0;
	isNeg = [ x for x in negation if tweet.find(x) != -1];
	
	for word in positiveWords:
		word = plmtzr.lemmatize(word); #Stemming the word
		pos = tweet.find(word);
		if pos != -1 and tweet[pos-1]==' ' and ( tweet[pos+len(word)] == ' ' or tweet[pos+len(word)] == '.' or len(tweet)==pos+len(word) ):
			aspect +=1;
			positive_score += 1;
			
	for word in negativeWords:
		word = plmtzr.lemmatize(word); #Stemming the word
		pos = tweet.find(word);
		if pos != -1 and tweet[pos-1]==' ':
			aspect +=1;
			negative_score+=1;
	return aspect, positive_score, negative_score
	
def bigramTester(tweet, aspectList, aspect, posWordsB, negWordsB, posWordsA, negWordsA):
	#posWordsB : positive words that can come before aspectWords
	#posWordsA : positive words that can come after aspectWords
	positive_score = 0;		negative_score=0;		
	isNeg = [ x for x in negation if tweet.find(x) != -1];
	
	for word2 in aspectList:
		word2 = plmtzr.lemmatize(word2); #Stemming the word
		pos2 = tweet.find(word2);
		if pos2 != -1 and (tweet[pos2-1]==' ' or pos2 == 0) and ( tweet[pos2+len(word2)] == ' ' or tweet[pos2+len(word2)] == '.' or len(tweet)==pos2+len(word2) ):
			aspect += 1; #tweet talks about service aspect
			
			for word1 in posWordsB:
				word1 = plmtzr.lemmatize(word1); #Stemming the word
				pos1 = tweet.find(word1);
				#Verb occurs before adverb
				if pos2 > pos1 and pos1 != -1 and ( tweet[pos1-1]==' ' or pos1 == 0) and ( tweet[pos1+len(word1)] == ' ' or tweet[pos1+len(word1)] == '.' or len(tweet)==pos1+len(word1) ): 
					if isNeg == []: #Negation does not occur in the tweet
						print word1;
						positive_score += 1;
					else:
						negative_score += 1;
						
			for word1 in negWordsB:
				word1 = plmtzr.lemmatize(word1); #Stemming the word
				pos1 = tweet.find(word1);
				#Verb occurs before adverb
				if pos2 > pos1 and pos1 != -1 and ( tweet[pos1-1]==' ' or pos1 == 0) and ( tweet[pos1+len(word1)] == ' ' or tweet[pos1+len(word1)] == '.' or len(tweet)==pos1+len(word1) ): 
					if isNeg == []: #Negation does not occur in the tweet
						print word1;
						negative_score += 1;
					#~ else:
						#~ positive_score += 1;
			
			for word1 in posWordsA:
				word1 = plmtzr.lemmatize(word1); #Stemming the word
				pos1 = tweet.find(word1);
				#Verb occurs after adverb
				if pos2 < pos1 and tweet[pos1-1]==' ' and ( tweet[pos1+len(word1)] == ' ' or tweet[pos1+len(word1)] == '.' or len(tweet)==pos1+len(word1) ):
					if isNeg == []: #Negation does not occur in the tweet
						positive_score += 1;
					else:
						negative_score += 1;
						
			for word1 in negWordsA:
				word1 = plmtzr.lemmatize(word1); #Stemming the word
				pos1 = tweet.find(word1);
				#Verb occurs after adverb
				if pos2 < pos1 and tweet[pos1-1]==' ' and ( tweet[pos1+len(word1)] == ' ' or tweet[pos1+len(word1)] == '.' or len(tweet)==pos1+len(word1) ):
					if isNeg == []: #Negation does not occur in the tweet
						print word1;
						negative_score += 1;
					#~ else:
						#~ positive_score += 1;		
							
	return aspect, positive_score, negative_score			

def trigramTester(tweet, aspect, satisfactionAspect, satisfactionPosC1, satisfactionNegC1, service_provider):
	positive_score = 0;		negative_score=0;
	isNeg = [ x for x in negation if tweet.find(x) != -1];
	
	for word1 in satisfactionAspect:
		word1 = plmtzr.lemmatize(word1); #Stemming the word
		pos1  = tweet.find(word1);
		
		if pos1 != -1 and (tweet[pos1-1]==' ' or pos1 == 0):
			aspect += 1; #tweet talks about satisfaction aspect
			for word2 in satisfactionPosC1:
				word2 = plmtzr.lemmatize(word2); #Stemming the word
				pos2  = tweet.find(word2);
				if pos2 > pos1 and tweet[pos2-1]==' ':
					for word3 in service_provider:
						word3 = plmtzr.lemmatize(word3); #Stemming the word
						pos3  = tweet.find(word3);
						if pos3 > pos2 and tweet[pos3-1]==' ':
							if isNeg == []: #Negation does not occur in the tweet
								positive_score += 1;
							else:
								negative_score += 1;
							
			for word2 in satisfactionNegC1:
				word2 = plmtzr.lemmatize(word2); #Stemming the word
				pos2  = tweet.find(word2);
				if pos2 > pos1 and tweet[pos2-1]==' ':
					for word3 in service_provider:
						word3 = plmtzr.lemmatize(word3); #Stemming the word
						pos3  = tweet.find(word3);
						if pos3 > pos2 and tweet[pos3-1]==' ':
							if isNeg == -1: #Negation does not occur in the tweet
								negative_score += 1;
							else:
								positive_score += 1;
								
	return aspect, positive_score, negative_score													
							
def classifier(tweet, service_provider):
	positive_score = 0;		negative_score=0;		neutral_score=0;
	isPrice=0;		isService=0;		isSatis=0;		isMisc=0;
	
	#Check for price aspect
	isPrice,   positive_scoreP, negative_scoreP = bigramTester(tweet, priceAspect, isPrice, pricePosVerb+POSWORDS, priceNegVerb+NEGWORDS, pricePosVerb+POSWORDS, priceNegVerb+NEGWORDS);
	
	#Check for service aspect
	isService1, positive_scoreS1, negative_scoreS1 = bigramTester(tweet, serviceAspect + [service_provider], isService, servicePosClass1+POSWORDS, serviceNegClass1+NEGWORDS, servicePosClass2+POSWORDS, serviceNegClass2+NEGWORDS);
	isService,  positive_scoreS2, negative_scoreS2 = unigramTester(tweet, isService1, servicePosComb, serviceNegComb);

	#Check for satisfaction aspect
	isSatis1, positive_scoreSa1, negative_scoreSa1 = trigramTester(tweet, isSatis, satisfactionAspect, satisfactionPosC1, satisfactionNegC1, [service_provider]);
	isSatis,  positive_scoreSa2, negative_scoreSa2 = unigramTester(tweet, isSatis1, satisfactionPosComb, satisfactionNegComb);
	
	#Check for miscellaneous aspect
	isMisc1, positive_scoreM1, negative_scoreM1 = unigramTester(tweet, isMisc, miscPos, miscNeg);
	isMisc2, positive_scoreM2, negative_scoreM2 = bigramTester(tweet, miscAspect, isMisc1, miscPosClass1+POSWORDS, miscNegClass1+NEGWORDS, miscPosClass2+POSWORDS, miscNegClass2+NEGWORDS);
	isMisc,  positive_scoreM,  negative_scoreM  = unigramTester(tweet, isMisc2, miscPosComb, miscNegComb);
	
	positive_score = positive_scoreP + positive_scoreS1 + positive_scoreS2 + positive_scoreSa1 + positive_scoreSa2 + positive_scoreM + positive_scoreM1 + positive_scoreM2;
	negative_score = negative_scoreP + negative_scoreS1 + negative_scoreS2 + negative_scoreSa1 + negative_scoreSa2 + negative_scoreM + negative_scoreM1 + negative_scoreM2;
	
	#Check for neutral
	for word in neutral:
		word = plmtzr.lemmatize(word); #Stemming the word
		pos  = tweet.find(word);
		
		if pos != -1:
			neutral_score += 1;	
		
	return positive_score, negative_score, neutral_score, isPrice, isService, isSatis, isMisc

str1 = "salary for account officer at bharat sanchar nigam ltd s bsnl s average salary 400 lac http //tco/axiqe00k"
positive_score, negative_score, neutral_score, isPrice, isService, isSatis, isMisc = classifier(str1,"BSNL");
print str(positive_score) + " " + str(negative_score) + " " + str(neutral_score) + " " + str(isPrice) + " " + str(isService) + " " + str(isSatis) + " " + str(isMisc)
