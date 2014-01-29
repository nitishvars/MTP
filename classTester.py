import re;

pricePosVerb = ["decrease","reduction"];
priceNegVerb = ["increase"];
priceAspect = ["call rate","rate"];

serviceNegClass1 = ["pathetic","shittiest","no","worst"]; #all slangs
serviceNegClass2 = ["down","drop","worse","slow"];
serviceNegComb = ["out of coverage","too much interrupt", "recharge not successful", "always good"];

servicePosClass1 = ["amazing","awesome","good","love","unlimited","exclusive","late"]; #all positive
servicePosClass2 = ["back","up","great"];
servicePosComb = ["no interrupt", "recharge successful"];

serviceAspect = ["network","speed","call","3g","2g","gprs","internet","coverage","browse","msg","message","delivery","plan"];

miscPos = ["waive off","waive-off","hive off","hive-off","bailout","launch","success","bid","implement"];
miscNeg = ["corruption"];

satisfactionAspect = ["change","port","activated","churned"];
satisfactionPosC1 = ["to","too"];
satisfactionNegC1 = ["from"];

satisfactionPosComb = ["zindabad"];
satisfactionNegComb = [];

neutral = ["dialup", "wire", "landline", "PWD"];

from nltk.stem.snowball import PorterStemmer
plmtzr = PorterStemmer()

def unigramTester(tweet, aspect, positiveWords, negativeWords):
	positive_score = 0;		negative_score=0;
	isNeg = tweet.find(" no ") or tweet.find(" not ");
	
	for word in positiveWords:
		word = plmtzr.stem(word); #Stemming the word
		pos = tweet.find(word);
		if pos != -1 and tweet[pos-1]==' ':
			aspect +=1;
			positive_score += 1;
			
	for word in negativeWords:
		word = plmtzr.stem(word); #Stemming the word
		pos = tweet.find(word);
		if pos != -1 and tweet[pos-1]==' ':
			aspect +=1;
			negative_score+=1;
	return aspect, positive_score, negative_score
	
def bigramTester(tweet, aspectList, aspect, posWordsB, negWordsB, posWordsA, negWordsA):
	#posWordsB : positive words that can come before aspectWords
	#posWordsA : positive words that can come after aspectWords
	positive_score = 0;		negative_score=0;		
	isNeg = tweet.find(" no ") or tweet.find(" not ");
	
	#Check for price
	for word2 in aspectList:
		word2 = plmtzr.stem(word2); #Stemming the word
		pos2 = tweet.find(word2);
		if pos2 != -1 and tweet[pos2-1]==' ':
			aspect += 1; #tweet talks about service aspect
			
			for word1 in posWordsB:
				word1 = plmtzr.stem(word1); #Stemming the word
				pos1 = tweet.find(word1);
				if pos2 > pos1 and pos1 != -1 and tweet[pos1-1]==' ': #Verb occurs before adverb
					if isNeg == -1: #Negation does not occur in the tweet
						positive_score += 1;
					else:
						negative_score += 1;
						
			for word1 in negWordsB:
				pos1 = tweet.find(word1);
				if pos2 > pos1 and pos1 != -1 and tweet[pos1-1]==' ': #Verb occurs before adverb
					if isNeg == -1: #Negation does not occur in the tweet
						negative_score += 1;
					else:
						positive_score += 1;
			
			for word1 in posWordsA:
				pos1 = tweet.find(word1);
				if pos2 < pos1 and tweet[pos1-1]==' ': #Verb occurs after adverb
					if isNeg == -1: #Negation does not occur in the tweet
						positive_score += 1;
					else:
						negative_score += 1;
						
			for word1 in negWordsA:
				pos1 = tweet.find(word1);
				if pos2 < pos1 and tweet[pos1-1]==' ': #Verb occurs after adverb
					if isNeg == -1: #Negation does not occur in the tweet
						negative_score += 1;
					else:
						positive_score += 1;		
							
	return aspect, positive_score, negative_score			

def trigramTester(tweet, aspect, satisfactionAspect, satisfactionPosC1, satisfactionNegC1, service_provider):
	positive_score = 0;		negative_score=0;
	isNeg = tweet.find(" no ") or tweet.find(" not ");
	
	for word1 in satisfactionAspect:
		word1 = plmtzr.stem(word1); #Stemming the word
		pos1  = tweet.find(word1);
		
		if pos1 != -1 and tweet[pos1-1]==' ':
			aspect += 1; #tweet talks about satisfaction aspect
			for word2 in satisfactionPosC1:
				word2 = plmtzr.stem(word2); #Stemming the word
				pos2  = tweet.find(word2);
				if pos2 > pos1 and tweet[pos2-1]==' ':
					for word3 in service_provider:
						word3 = plmtzr.stem(word3); #Stemming the word
						pos3  = tweet.find(word3);
						if pos3 > pos2 and tweet[pos3-1]==' ':
							if isNeg == -1: #Negation does not occur in the tweet
								positive_score += 1;
							else:
								negative_score += 1;
							
			for word2 in satisfactionNegC1:
				word2 = plmtzr.stem(word2); #Stemming the word
				pos2  = tweet.find(word2);
				if pos2 > pos1 and tweet[pos2-1]==' ':
					for word3 in service_provider:
						word3 = plmtzr.stem(word3); #Stemming the word
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
	isPrice,   positive_scoreP, negative_scoreP = bigramTester(tweet, priceAspect, isPrice, pricePosVerb, priceNegVerb, [], []);
	
	#Check for service aspect
	isService1, positive_scoreS1, negative_scoreS1 = bigramTester(tweet, serviceAspect, isService, servicePosClass1, serviceNegClass1, servicePosClass2, serviceNegClass2);
	isService,  positive_scoreS2, negative_scoreS2 = unigramTester(tweet, isService1, servicePosComb, serviceNegComb);

	#Check for satisfaction aspect
	isSatis1, positive_scoreSa1, negative_scoreSa1 = trigramTester(tweet, isSatis, satisfactionAspect, satisfactionPosC1, satisfactionNegC1, [service_provider]);
	isSatis,  positive_scoreSa2, negative_scoreSa2 = unigramTester(tweet, isSatis1, satisfactionPosComb, satisfactionNegComb);
	
	#Check for miscellaneous aspect
	isMisc, positive_scoreM, negative_scoreM = unigramTester(tweet, isMisc, miscPos, miscNeg);
	
	positive_score = positive_scoreP + positive_scoreS1 + positive_scoreS2 + positive_scoreSa1 + positive_scoreSa2 + positive_scoreM;
	negative_score = negative_scoreP + negative_scoreS1 + negative_scoreS2 + negative_scoreSa1 + negative_scoreSa2 + negative_scoreM;
	
	#Check for neutral
	for word in neutral:
		word = plmtzr.stem(word); #Stemming the word
		pos  = tweet.find(word);
		
		if pos != -1:
			neutral_score += 1;	
		
	return positive_score, negative_score, neutral_score, isPrice, isService, isSatis, isMisc

#~ str1 = "bsnl internet - too much interruptions these days";
#~ positive_score, negative_score, neutral_score, isPrice, isService, isSatis, isMisc = classifier(str1,"BSNL");
#~ print str(positive_score) + " " + str(negative_score) + " " + str(neutral_score) + " " + str(isPrice) + " " + str(isService) + " " + str(isSatis) + " " + str(isMisc)
