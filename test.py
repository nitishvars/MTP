def makeSet(filename):
	wordSet = {}
	with open(filename) as infile:
		for line in infile:
			word=line.strip();
			wordSet[word] = 1;
	return wordSet	

SLANGWORDS = makeSet('slang.txt').keys()
print SLANGWORDS
