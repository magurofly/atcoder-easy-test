# AtCoder Easy Test

# 開発

keymoonさんのac-predictorをかなり参考にしています。

こちらの記事をぜひご一読ください。

- [AtCoder Easy Test を支える技術](https://qiita.com/magurofly/items/4b60dc02283e70230f71)

# ブックマークレット

javascript(async()%3D%3E%7Bconst%20config%3DJSON.parse(localStorage.AtCoderEasyTest%24config%7C%7C%22%7B%7D%22)%3Bconst%20GM_getValue%3D(key%2CdefaultValue%3Dnull)%3D%3E%7Bif(!(key%20in%20config))return%20defaultValue%3Breturn%20config%5Bkey%5D%7D%3Bconst%20GM_setValue%3D(key%2Cvalue)%3D%3E%7Bconfig%5Bkey%5D%3Dvalue%3BlocalStorage.AtCoderEasyTest%24config%3DJSON.stringify(config)%7D%3Bconst%20script%3Dawait%20fetch(%22https%3A%2F%2Fcdn.jsdelivr.net%2Fgh%2Fmagurofly%2Fatcoder-easy-test%40master%2Fv2%2Fatcoder-easy-test.user.js%22).then(r%3D%3Er.text())%3BFunction(%22unsafeWindow%22%2C%22GM_getValue%22%2C%22GM_setValue%22%2Cscript)(window%2C%0D%0AGM_getValue%2CGM_setValue)%7D)()%3B
