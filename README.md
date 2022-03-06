# Objectives

1.  Identify the 15 most common letters in the list
2.  Find all words that use all 15 letters in the list

## Ideas

* Rank of a word is the sum of the offsets of each letter in the list of 15 words.  Example:
  * Best letters:
    * s - 0
    * e - 1
    * a - 2
    * o - 3
    * r - 4
    * i - 5
    * l - 6
    * t - 7
    * n - 8
    * u - 9
    * d - 10
    * c - 11
    * y - 12
    * p - 13
    * m - 14
  * Word:  `abase` would have rank:
    * a: 2
    * b: 100
    * a: 2
    * s: 0
    * e: 1
    * total: 105

* Find potential words recursively
  * Start with all words from the letter `s`
  * Find all words in letter `e`, then `a` that don't have an `s` in them
  * Recurse finding all words that have unique letters and use all 15 of the best letters
  