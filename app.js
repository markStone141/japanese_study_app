    import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
    import {
      getFirestore,
      collection,
      getDocs
    } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

    const firebaseConfig = window.FIREBASE_CONFIG || null;
    const firebaseReady = Boolean(firebaseConfig && firebaseConfig.apiKey && !String(firebaseConfig.apiKey).startsWith("YOUR_"));
    let firestore = null;
    let syncEnabled = false;
    const defaultSource = {
      textbookId: "minna-no-nihongo",
      textbookName: "みんなの日本語",
      levelId: "shokyu-1",
      levelName: "初級I",
      verbGroupId: "group-1",
      verbGroupName: "グループ1"
    };

    /*
      動詞を追加するときは、この配列に同じ形式で追加してください。

      {
        dictionary: "辞書形",
        meaning: "英語などの意味",
        masu: "ますけい / masu-form",
        te: "てけい / te-form",
        ta: "たけい / ta-form",
        nai: "ないけい / nai-form"
      }
    */
    let verbs = [
      { dictionary: "あう", meaning: "meet", masu: "あいます", te: "あって", ta: "あった", nai: "あわない" },
      { dictionary: "あそぶ", meaning: "enjoy oneself, play", masu: "あそびます", te: "あそんで", ta: "あそんだ", nai: "あそばない" },
      { dictionary: "ある", meaning: "exist, be", masu: "あります", te: "あって", ta: "あった", nai: "ない" },
      { dictionary: "あるく", meaning: "walk", masu: "あるきます", te: "あるいて", ta: "あるいた", nai: "あるかない" },
      { dictionary: "いう", meaning: "say", masu: "いいます", te: "いって", ta: "いった", nai: "いわない" },
      { dictionary: "いく", meaning: "go", masu: "いきます", te: "いって", ta: "いった", nai: "いかない" },
      { dictionary: "いそぐ", meaning: "hurry", masu: "いそぎます", te: "いそいで", ta: "いそいだ", nai: "いそがない" },
      { dictionary: "いる", meaning: "need, require", masu: "いります", te: "いって", ta: "いった", nai: "いらない" },
      { dictionary: "うごく", meaning: "move, work", masu: "うごきます", te: "うごいて", ta: "うごいた", nai: "うごかない" },
      { dictionary: "うたう", meaning: "sing", masu: "うたいます", te: "うたって", ta: "うたった", nai: "うたわない" },
      { dictionary: "うる", meaning: "sell", masu: "うります", te: "うって", ta: "うった", nai: "うらない" },
      { dictionary: "おく", meaning: "put", masu: "おきます", te: "おいて", ta: "おいた", nai: "おかない" },
      { dictionary: "おくる", meaning: "send", masu: "おくります", te: "おくって", ta: "おくった", nai: "おくらない" },
      { dictionary: "おす", meaning: "push, press", masu: "おします", te: "おして", ta: "おした", nai: "おさない" },
      { dictionary: "おもう", meaning: "think", masu: "おもいます", te: "おもって", ta: "おもった", nai: "おもわない" },
      { dictionary: "およぐ", meaning: "swim", masu: "およぎます", te: "およいで", ta: "およいだ", nai: "およがない" },
      { dictionary: "おわる", meaning: "finish", masu: "おわります", te: "おわって", ta: "おわった", nai: "おわらない" },
      { dictionary: "かう", meaning: "buy", masu: "かいます", te: "かって", ta: "かった", nai: "かわない" },
      { dictionary: "かえす", meaning: "give back, return", masu: "かえします", te: "かえして", ta: "かえした", nai: "かえさない" },
      { dictionary: "かえる", meaning: "go home, return", masu: "かえります", te: "かえって", ta: "かえった", nai: "かえらない" },
      { dictionary: "かく", meaning: "write, draw, paint", masu: "かきます", te: "かいて", ta: "かいた", nai: "かかない" },
      { dictionary: "かかる", meaning: "take, cost", masu: "かかります", te: "かかって", ta: "かかった", nai: "かからない" },
      { dictionary: "かす", meaning: "lend", masu: "かします", te: "かして", ta: "かした", nai: "かさない" },
      { dictionary: "かつ", meaning: "win", masu: "かちます", te: "かって", ta: "かった", nai: "かたない" },
      { dictionary: "かぶる", meaning: "put on a hat", masu: "かぶります", te: "かぶって", ta: "かぶった", nai: "かぶらない" },
      { dictionary: "がんばる", meaning: "do one's best", masu: "がんばります", te: "がんばって", ta: "がんばった", nai: "がんばらない" },
      { dictionary: "きく", meaning: "listen, ask", masu: "ききます", te: "きいて", ta: "きいた", nai: "きかない" },
      { dictionary: "けす", meaning: "turn off, erase", masu: "けします", te: "けして", ta: "けした", nai: "けさない" },
      { dictionary: "さがす", meaning: "look for", masu: "さがします", te: "さがして", ta: "さがした", nai: "さがさない" },
      { dictionary: "しぬ", meaning: "die", masu: "しにます", te: "しんで", ta: "しんだ", nai: "しなない" },
      { dictionary: "すわる", meaning: "sit", masu: "すわります", te: "すわって", ta: "すわった", nai: "すわらない" },
      { dictionary: "たつ", meaning: "stand", masu: "たちます", te: "たって", ta: "たった", nai: "たたない" },
      { dictionary: "つかう", meaning: "use", masu: "つかいます", te: "つかって", ta: "つかった", nai: "つかわない" },
      { dictionary: "とる", meaning: "take", masu: "とります", te: "とって", ta: "とった", nai: "とらない" },
      { dictionary: "のむ", meaning: "drink", masu: "のみます", te: "のんで", ta: "のんだ", nai: "のまない" },
      { dictionary: "はなす", meaning: "speak", masu: "はなします", te: "はなして", ta: "はなした", nai: "はなさない" },
      { dictionary: "まつ", meaning: "wait", masu: "まちます", te: "まって", ta: "まった", nai: "またない" },
      { dictionary: "よぶ", meaning: "call", masu: "よびます", te: "よんで", ta: "よんだ", nai: "よばない" },
      { dictionary: "よむ", meaning: "read", masu: "よみます", te: "よんで", ta: "よんだ", nai: "よまない" },
      { dictionary: "わかる", meaning: "understand", masu: "わかります", te: "わかって", ta: "わかった", nai: "わからない" },
      { dictionary: "たべる", meaning: "eat", masu: "たべます", te: "たべて", ta: "たべた", nai: "たべない" },
      { dictionary: "みる", meaning: "see, watch", masu: "みます", te: "みて", ta: "みた", nai: "みない" },
      { dictionary: "おきる", meaning: "wake up", masu: "おきます", te: "おきて", ta: "おきた", nai: "おきない" },
      { dictionary: "ねる", meaning: "sleep", masu: "ねます", te: "ねて", ta: "ねた", nai: "ねない" },
      { dictionary: "する", meaning: "do", masu: "します", te: "して", ta: "した", nai: "しない" },
      { dictionary: "きく（せんせいに）", meaning: "ask the teacher", masu: "ききます", te: "きいて", ta: "きいた", nai: "きかない" },
      { dictionary: "きる", meaning: "cut, slice", masu: "きります", te: "きって", ta: "きった", nai: "きらない" },
      { dictionary: "さわる（どあに）", meaning: "touch a door", masu: "さわります", te: "さわって", ta: "さわった", nai: "さわらない" },
      { dictionary: "しる", meaning: "get to know", masu: "しります", te: "しって", ta: "しった", nai: "しらない" },
      { dictionary: "すう（たばこを）", meaning: "smoke a cigarette", masu: "すいます", te: "すって", ta: "すった", nai: "すわない" },
      { dictionary: "すむ", meaning: "live, reside", masu: "すみます", te: "すんで", ta: "すんだ", nai: "すまない" },
      { dictionary: "だす", meaning: "take out, hand in, send", masu: "だします", te: "だして", ta: "だした", nai: "ださない" },
      { dictionary: "つく", meaning: "arrive", masu: "つきます", te: "ついて", ta: "ついた", nai: "つかない" },
      { dictionary: "つくる", meaning: "make, produce", masu: "つくります", te: "つくって", ta: "つくった", nai: "つくらない" },
      { dictionary: "つれていく", meaning: "take someone with you", masu: "つれていきます", te: "つれていって", ta: "つれていった", nai: "つれていかない" },
      { dictionary: "てつだう", meaning: "help, assist", masu: "てつだいます", te: "てつだって", ta: "てつだった", nai: "てつだわない" },
      { dictionary: "とまる（ほてるに）", meaning: "stay at a hotel", masu: "とまります", te: "とまって", ta: "とまった", nai: "とまらない" },
      { dictionary: "とる（しゃしんを）", meaning: "take a photograph", masu: "とります", te: "とって", ta: "とった", nai: "とらない" },
      { dictionary: "なおる", meaning: "recover, get better", masu: "なおります", te: "なおって", ta: "なおった", nai: "なおらない" },
      { dictionary: "なくす", meaning: "lose", masu: "なくします", te: "なくして", ta: "なくした", nai: "なくさない" },
      { dictionary: "ならう", meaning: "learn", masu: "ならいます", te: "ならって", ta: "ならった", nai: "ならわない" },
      { dictionary: "なる", meaning: "become", masu: "なります", te: "なって", ta: "なった", nai: "ならない" },
      { dictionary: "ぬぐ", meaning: "take off clothes or shoes", masu: "ぬぎます", te: "ぬいで", ta: "ぬいだ", nai: "ぬがない" },
      { dictionary: "のぼる", meaning: "climb, go up", masu: "のぼります", te: "のぼって", ta: "のぼった", nai: "のぼらない" },
      { dictionary: "のむ（くすりを）", meaning: "take medicine", masu: "のみます", te: "のんで", ta: "のんだ", nai: "のまない" },
      { dictionary: "のる", meaning: "get on, ride", masu: "のります", te: "のって", ta: "のった", nai: "のらない" },
      { dictionary: "はいる（だいがくに）", meaning: "enter a university", masu: "はいります", te: "はいって", ta: "はいった", nai: "はいらない" },
      { dictionary: "はいる（きっさてんに）", meaning: "enter a cafe", masu: "はいります", te: "はいって", ta: "はいった", nai: "はいらない" },
      { dictionary: "はく", meaning: "put on shoes, trousers, etc.", masu: "はきます", te: "はいて", ta: "はいた", nai: "はかない" },
      { dictionary: "はたらく", meaning: "work", masu: "はたらきます", te: "はたらいて", ta: "はたらいた", nai: "はたらかない" },
      { dictionary: "ひく", meaning: "play a stringed instrument or piano", masu: "ひきます", te: "ひいて", ta: "ひいた", nai: "ひかない" },
      { dictionary: "ふる", meaning: "rain", masu: "ふります", te: "ふって", ta: "ふった", nai: "ふらない" },
      { dictionary: "まがる", meaning: "turn", masu: "まがります", te: "まがって", ta: "まがった", nai: "まがらない" },
      { dictionary: "まわす", meaning: "turn, rotate", masu: "まわします", te: "まわして", ta: "まわした", nai: "まわさない" },
      { dictionary: "もつ", meaning: "hold, have", masu: "もちます", te: "もって", ta: "もった", nai: "もたない" },
      { dictionary: "もっていく", meaning: "take something", masu: "もっていきます", te: "もっていって", ta: "もっていった", nai: "もっていかない" },
      { dictionary: "もらう", meaning: "receive", masu: "もらいます", te: "もらって", ta: "もらった", nai: "もらわない" },
      { dictionary: "やくにたつ", meaning: "be useful", masu: "やくにたちます", te: "やくにたって", ta: "やくにたった", nai: "やくにたたない" },
      { dictionary: "やすむ", meaning: "take a rest or holiday", masu: "やすみます", te: "やすんで", ta: "やすんだ", nai: "やすまない" },
      { dictionary: "やすむ（しごとを）", meaning: "take a day off work", masu: "やすみます", te: "やすんで", ta: "やすんだ", nai: "やすまない" },
      { dictionary: "わたる（はしを）", meaning: "cross a bridge", masu: "わたります", te: "わたって", ta: "わたった", nai: "わたらない" },
      { dictionary: "くる", meaning: "come", masu: "きます", te: "きて", ta: "きた", nai: "こない" }
    ];

    verbs = verbs.map((verb, index) => ({
      ...defaultSource,
      order: index + 1,
      ...verb
    }));

    const formLabels = {
      masu: "ますけい / masu-form",
      te: "てけい / te-form",
      ta: "たけい / ta-form",
      nai: "ないけい / nai-form"
    };

    const formDisplay = {
      masu: { ja: "ます けい", en: "MASU FORM" },
      te: { ja: "て けい", en: "TE FORM" },
      ta: { ja: "た けい", en: "TA FORM" },
      nai: { ja: "ない けい", en: "NAI FORM" }
    };

    const exampleSentences = {
  "あう": {
    "masu": [
      "あした、えきで ともだちに あいます。",
      "I will meet my friend at the station tomorrow."
    ],
    "te": [
      "えきで ともだちに あって、いっしょに ひるごはんを たべます。",
      "I will meet my friend at the station and have lunch together."
    ],
    "ta": [
      "きのう、ひさしぶりに せんせいに あった。",
      "Yesterday, I met my teacher for the first time in a while."
    ],
    "nai": [
      "きょうは いそがしいので、だれにも あわない。",
      "I am busy today, so I will not meet anyone."
    ]
  },
  "あそぶ": {
    "masu": [
      "にちようびに こどもと こうえんで あそびます。",
      "I play with my child in the park on Sundays."
    ],
    "te": [
      "こうえんで あそんでから、うちへ かえります。",
      "After playing in the park, I will go home."
    ],
    "ta": [
      "きのう、みんなで たのしく あそんだ。",
      "Yesterday, we had fun playing together."
    ],
    "nai": [
      "しゅくだいが おわるまで、げーむで あそばない。",
      "I will not play games until I finish my homework."
    ]
  },
  "ある": {
    "masu": [
      "つくえの うえに じしょが あります。",
      "There is a dictionary on the desk."
    ],
    "te": [
      "この まちには こうえんが あって、こどもが よく あそびます。",
      "There is a park in this town, and children often play there."
    ],
    "ta": [
      "むかし、ここに ちいさい えきが あった。",
      "There used to be a small station here."
    ],
    "nai": [
      "この へやには えあこんが ない。",
      "There is no air conditioner in this room."
    ]
  },
  "あるく": {
    "masu": [
      "まいあさ、えきまで あるきます。",
      "I walk to the station every morning."
    ],
    "te": [
      "えきから じゅっぷん あるいて、がっこうに つきました。",
      "I walked for ten minutes from the station and arrived at school."
    ],
    "ta": [
      "きのう、かわの そばを ながく あるいた。",
      "Yesterday, I walked for a long time by the river."
    ],
    "nai": [
      "あめの ひは えきまで あるかない。",
      "I do not walk to the station on rainy days."
    ]
  },
  "いう": {
    "masu": [
      "せんせいに「ありがとう」と いいます。",
      "I say \"thank you\" to the teacher."
    ],
    "te": [
      "なまえを いってから、へやに はいってください。",
      "Please say your name before entering the room."
    ],
    "ta": [
      "かれは「あした きます」と いった。",
      "He said, \"I will come tomorrow.\""
    ],
    "nai": [
      "その ことは だれにも いわない。",
      "I will not tell anyone about that."
    ]
  },
  "いく": {
    "masu": [
      "あした、でんしゃで とうきょうへ いきます。",
      "I will go to Tokyo by train tomorrow."
    ],
    "te": [
      "ぎんこうへ いって、おかねを おろします。",
      "I will go to the bank and withdraw money."
    ],
    "ta": [
      "せんしゅう、かぞくと きょうとへ いった。",
      "Last week, I went to Kyoto with my family."
    ],
    "nai": [
      "きょうは つかれたので、どこにも いかない。",
      "I am tired today, so I will not go anywhere."
    ]
  },
  "いそぐ": {
    "masu": [
      "でんしゃに まにあうように いそぎます。",
      "I hurry so that I can catch the train."
    ],
    "te": [
      "じかんが ないので、いそいで ください。",
      "There is no time, so please hurry."
    ],
    "ta": [
      "ちこくしそうだったので、えきまで いそいだ。",
      "I hurried to the station because I was about to be late."
    ],
    "nai": [
      "まだ じかんが あるので、いそがない。",
      "There is still time, so I will not hurry."
    ]
  },
  "いる": {
    "masu": [
      "りょこうには ぱすぽーとが いります。",
      "You need a passport for the trip."
    ],
    "te": [
      "この しごとは じかんが いって、たいへんです。",
      "This job takes time and is difficult."
    ],
    "ta": [
      "びざの しんせいには たくさんの しょるいが いった。",
      "Many documents were needed for the visa application."
    ],
    "nai": [
      "この へやでは くつは いらない。",
      "You do not need shoes in this room."
    ]
  },
  "うごく": {
    "masu": [
      "この とけいは まだ うごきます。",
      "This clock still works."
    ],
    "te": [
      "ろぼっとが うごいて、にもつを はこびます。",
      "The robot moves and carries the luggage."
    ],
    "ta": [
      "ぼたんを おしたら、きかいが うごいた。",
      "When I pressed the button, the machine started moving."
    ],
    "nai": [
      "でんちが ないので、この おもちゃは うごかない。",
      "This toy does not work because it has no battery."
    ]
  },
  "うたう": {
    "masu": [
      "からおけで にほんの うたを うたいます。",
      "I sing Japanese songs at karaoke."
    ],
    "te": [
      "みんなで うたって、たんじょうびを いわいました。",
      "We sang together and celebrated the birthday."
    ],
    "ta": [
      "きのう、すきな うたを うたった。",
      "Yesterday, I sang my favorite song."
    ],
    "nai": [
      "ひとまえでは はずかしいので、うたわない。",
      "I am shy in front of people, so I do not sing."
    ]
  },
  "うる": {
    "masu": [
      "この みせは しんせんな やさいを うります。",
      "This shop sells fresh vegetables."
    ],
    "te": [
      "ふるい じてんしゃを うって、あたらしいのを かいました。",
      "I sold my old bicycle and bought a new one."
    ],
    "ta": [
      "きのう、つかわない ほんを うった。",
      "Yesterday, I sold books that I no longer use."
    ],
    "nai": [
      "この かばんは おもいでが あるので、うらない。",
      "I will not sell this bag because it has sentimental value."
    ]
  },
  "おく": {
    "masu": [
      "かぎを つくえの うえに おきます。",
      "I put the key on the desk."
    ],
    "te": [
      "にもつを ここに おいて ください。",
      "Please put your luggage here."
    ],
    "ta": [
      "れいぞうこに けーきを おいた。",
      "I put the cake in the refrigerator."
    ],
    "nai": [
      "ここには じてんしゃを おかないで ください。",
      "Please do not leave bicycles here."
    ]
  },
  "おくる": {
    "masu": [
      "ははに たんじょうびの ぷれぜんとを おくります。",
      "I send my mother a birthday present."
    ],
    "te": [
      "しゃしんを めーるで おくって ください。",
      "Please send the photo by email."
    ],
    "ta": [
      "きのう、かいしゃに しょるいを おくった。",
      "Yesterday, I sent the documents to the company."
    ],
    "nai": [
      "じゅうしょが わからないので、まだ にもつを おくらない。",
      "I do not know the address, so I will not send the package yet."
    ]
  },
  "おす": {
    "masu": [
      "えれべーたーの ぼたんを おします。",
      "I press the elevator button."
    ],
    "te": [
      "あおい ぼたんを おして ください。",
      "Please press the blue button."
    ],
    "ta": [
      "まちがえて ひじょうぼたんを おした。",
      "I accidentally pressed the emergency button."
    ],
    "nai": [
      "きけんなので、この すいっちは おさないで ください。",
      "This switch is dangerous, so please do not press it."
    ]
  },
  "おもう": {
    "masu": [
      "この ほんは おもしろいと おもいます。",
      "I think this book is interesting."
    ],
    "te": [
      "だいじょうぶだと おもって、そのまま つづけました。",
      "I thought it would be fine, so I continued."
    ],
    "ta": [
      "さいしょは むずかしいと おもった。",
      "At first, I thought it was difficult."
    ],
    "nai": [
      "その けいかくが うまく いくとは おもわない。",
      "I do not think that plan will work."
    ]
  },
  "およぐ": {
    "masu": [
      "なつに うみで およぎます。",
      "I swim in the sea in summer."
    ],
    "te": [
      "ぷーるで さんじゅっぷん およいでから、しゃわーを あびます。",
      "I swim for thirty minutes in the pool and then take a shower."
    ],
    "ta": [
      "きのう、かわで およいだ。",
      "Yesterday, I swam in the river."
    ],
    "nai": [
      "みずが つめたいので、きょうは およがない。",
      "The water is cold, so I will not swim today."
    ]
  },
  "おわる": {
    "masu": [
      "しごとは ごじに おわります。",
      "Work finishes at five."
    ],
    "te": [
      "しごとが おわってから、すーぱーへ いきます。",
      "After work finishes, I will go to the supermarket."
    ],
    "ta": [
      "かいぎは よていより はやく おわった。",
      "The meeting ended earlier than planned."
    ],
    "nai": [
      "この しごとは きょうじゅうに おわらない。",
      "This work will not be finished today."
    ]
  },
  "かう": {
    "masu": [
      "すーぱーで ぎゅうにゅうを かいます。",
      "I buy milk at the supermarket."
    ],
    "te": [
      "きっぷを かって、でんしゃに のりました。",
      "I bought a ticket and got on the train."
    ],
    "ta": [
      "きのう、あたらしい くつを かった。",
      "Yesterday, I bought new shoes."
    ],
    "nai": [
      "たかすぎるので、この かばんは かわない。",
      "This bag is too expensive, so I will not buy it."
    ]
  },
  "かえす": {
    "masu": [
      "あした、としょかんに ほんを かえします。",
      "I will return the book to the library tomorrow."
    ],
    "te": [
      "つかった ぺんを もとの ばしょに かえして ください。",
      "Please return the pen to its original place after using it."
    ],
    "ta": [
      "きのう、ともだちに かりた おかねを かえした。",
      "Yesterday, I paid back the money I borrowed from my friend."
    ],
    "nai": [
      "まだ よんでいるので、この ほんは きょう かえさない。",
      "I am still reading this book, so I will not return it today."
    ]
  },
  "かえる": {
    "masu": [
      "きょうは ろくじに うちへ かえります。",
      "I will return home at six today."
    ],
    "te": [
      "しごとから かえって、すぐ ばんごはんを つくりました。",
      "I came home from work and immediately made dinner."
    ],
    "ta": [
      "きのうは おそく うちへ かえった。",
      "Yesterday, I came home late."
    ],
    "nai": [
      "きょうは ざんぎょうが あるので、はやく かえらない。",
      "I have overtime today, so I will not go home early."
    ]
  },
  "かく": {
    "masu": [
      "のーとに じぶんの なまえを かきます。",
      "I write my name in the notebook."
    ],
    "te": [
      "この かんじを さんかい かいて ください。",
      "Please write this kanji three times."
    ],
    "ta": [
      "きのう、ともだちに てがみを かいた。",
      "Yesterday, I wrote a letter to my friend."
    ],
    "nai": [
      "てすとでは えんぴつで こたえを かかないで ください。",
      "Please do not write your answers in pencil on the test."
    ]
  },
  "かかる": {
    "masu": [
      "えきまで あるいて じゅっぷん かかります。",
      "It takes ten minutes to walk to the station."
    ],
    "te": [
      "しゅうりに おかねが かかって、たいへんでした。",
      "The repair cost money, so it was difficult."
    ],
    "ta": [
      "びょういんまで いちじかん かかった。",
      "It took one hour to get to the hospital."
    ],
    "nai": [
      "この みちなら、さんじゅっぷんも かからない。",
      "This route will not take even thirty minutes."
    ]
  },
  "かす": {
    "masu": [
      "ともだちに かさを かします。",
      "I lend my umbrella to my friend."
    ],
    "te": [
      "その じしょを いちにち かして ください。",
      "Please lend me that dictionary for one day."
    ],
    "ta": [
      "きのう、どうりょうに ぱそこんを かした。",
      "Yesterday, I lent my computer to a coworker."
    ],
    "nai": [
      "たいせつな ものなので、だれにも かさない。",
      "It is important to me, so I will not lend it to anyone."
    ]
  },
  "かつ": {
    "masu": [
      "つぎの しあいでは ぜったいに かちます。",
      "We will definitely win the next game."
    ],
    "te": [
      "しあいに かって、みんなで よろこびました。",
      "We won the game and celebrated together."
    ],
    "ta": [
      "きのうの しあいで わたしたちの ちーむが かった。",
      "Our team won yesterday's game."
    ],
    "nai": [
      "れんしゅうしなければ、つぎの しあいには かたない。",
      "We will not win the next game unless we practice."
    ]
  },
  "かぶる": {
    "masu": [
      "そとへ でるとき、ぼうしを かぶります。",
      "I wear a hat when I go outside."
    ],
    "te": [
      "あついので、ぼうしを かぶって ください。",
      "It is hot, so please wear a hat."
    ],
    "ta": [
      "あかい ぼうしを かぶった ひとが せんせいです。",
      "The person wearing a red hat is the teacher."
    ],
    "nai": [
      "きょうは くもりなので、ぼうしを かぶらない。",
      "It is cloudy today, so I will not wear a hat."
    ]
  },
  "がんばる": {
    "masu": [
      "しけんに ごうかくできるように がんばります。",
      "I will do my best to pass the exam."
    ],
    "te": [
      "あと すこしです。がんばって ください。",
      "You are almost there. Please keep trying."
    ],
    "ta": [
      "まいにち れんしゅうして、ほんとうに がんばった。",
      "I practiced every day and really did my best."
    ],
    "nai": [
      "むりをしてまで がんばらないで ください。",
      "Please do not push yourself too hard."
    ]
  },
  "きく": {
    "masu": [
      "まいにち、でんしゃで おんがくを ききます。",
      "I listen to music on the train every day."
    ],
    "te": [
      "この おんせいを よく きいて ください。",
      "Please listen carefully to this audio."
    ],
    "ta": [
      "きのう、らじおで その にゅーすを きいた。",
      "Yesterday, I heard that news on the radio."
    ],
    "nai": [
      "べんきょうするときは おんがくを きかない。",
      "I do not listen to music while studying."
    ]
  },
  "けす": {
    "masu": [
      "へやを でるまえに でんきを けします。",
      "I turn off the light before leaving the room."
    ],
    "te": [
      "つかわない ぱそこんの でんげんを けして ください。",
      "Please turn off computers that are not being used."
    ],
    "ta": [
      "ねるまえに てれびを けした。",
      "I turned off the television before going to bed."
    ],
    "nai": [
      "まだ つかっているので、でんきを けさないで ください。",
      "I am still using it, so please do not turn off the light."
    ]
  },
  "さがす": {
    "masu": [
      "いんたーねっとで しごとを さがします。",
      "I look for a job online."
    ],
    "te": [
      "なくした かぎを いっしょに さがして ください。",
      "Please help me look for the lost key."
    ],
    "ta": [
      "えきの ちかくで やすい ほてるを さがした。",
      "I looked for an inexpensive hotel near the station."
    ],
    "nai": [
      "きょうは つかれたので、もう さがさない。",
      "I am tired today, so I will not search anymore."
    ]
  },
  "しぬ": {
    "masu": [
      "みずが ないと、さかなは しにます。",
      "Fish die without water."
    ],
    "te": [
      "その きは かれて しんでしまいました。",
      "That tree withered and died."
    ],
    "ta": [
      "ふゆの さむさで、にわの はなが しんだ。",
      "The flowers in the garden died from the winter cold."
    ],
    "nai": [
      "この さぼてんは みずが すくなくても しなない。",
      "This cactus does not die even with little water."
    ]
  },
  "すわる": {
    "masu": [
      "でんしゃでは いつも まどの ちかくに すわります。",
      "I always sit near the window on the train."
    ],
    "te": [
      "どうぞ、こちらに すわって ください。",
      "Please sit here."
    ],
    "ta": [
      "こうえんの べんちに すわった。",
      "I sat on a bench in the park."
    ],
    "nai": [
      "ぬれているので、その いすには すわらないで ください。",
      "That chair is wet, so please do not sit on it."
    ]
  },
  "たつ": {
    "masu": [
      "でんしゃが こんでいるときは、どあの ちかくに たちます。",
      "When the train is crowded, I stand near the door."
    ],
    "te": [
      "なまえを よばれたら、たって ください。",
      "Please stand when your name is called."
    ],
    "ta": [
      "おとしよりに せきを ゆずって、わたしは たった。",
      "I gave my seat to an elderly person and stood."
    ],
    "nai": [
      "きけんなので、いすの うえに たたないで ください。",
      "It is dangerous, so please do not stand on the chair."
    ]
  },
  "つかう": {
    "masu": [
      "しごとで まいにち ぱそこんを つかいます。",
      "I use a computer at work every day."
    ],
    "te": [
      "この あぷりを つかって、にほんごを れんしゅうします。",
      "I use this app to practice Japanese."
    ],
    "ta": [
      "きのう、はじめて でんしじしょを つかった。",
      "Yesterday, I used an electronic dictionary for the first time."
    ],
    "nai": [
      "じゅぎょうちゅうは すまーとふぉんを つかわないで ください。",
      "Please do not use smartphones during class."
    ]
  },
  "とる": {
    "masu": [
      "まいあさ、びたみんを とります。",
      "I take vitamins every morning."
    ],
    "te": [
      "さらを たなから とって ください。",
      "Please take a plate from the shelf."
    ],
    "ta": [
      "てーぶるの うえから さいふを とった。",
      "I took the wallet from the table."
    ],
    "nai": [
      "ひとの ものを かってに とらないで ください。",
      "Please do not take other people's things without permission."
    ]
  },
  "のむ": {
    "masu": [
      "まいあさ、こーひーを のみます。",
      "I drink coffee every morning."
    ],
    "te": [
      "つかれたので、みずを のんで やすみました。",
      "I drank water and rested because I was tired."
    ],
    "ta": [
      "さっき、あたたかい おちゃを のんだ。",
      "I drank some hot tea a little while ago."
    ],
    "nai": [
      "よるは こーひーを のまない。",
      "I do not drink coffee at night."
    ]
  },
  "はなす": {
    "masu": [
      "ともだちと にほんごで はなします。",
      "I speak Japanese with my friend."
    ],
    "te": [
      "もう すこし ゆっくり はなして ください。",
      "Please speak a little more slowly."
    ],
    "ta": [
      "きのう、せんせいと しんろについて はなした。",
      "Yesterday, I spoke with my teacher about my future plans."
    ],
    "nai": [
      "としょかんでは おおきな こえで はなさないで ください。",
      "Please do not speak loudly in the library."
    ]
  },
  "まつ": {
    "masu": [
      "えきの まえで ともだちを まちます。",
      "I wait for my friend in front of the station."
    ],
    "te": [
      "ここで すこし まって ください。",
      "Please wait here for a moment."
    ],
    "ta": [
      "ばすを にじゅっぷん まった。",
      "I waited for the bus for twenty minutes."
    ],
    "nai": [
      "じかんが ないので、もう またない。",
      "I do not have time, so I will not wait any longer."
    ]
  },
  "よぶ": {
    "masu": [
      "にもつが おおいので、たくしーを よびます。",
      "I call a taxi because I have a lot of luggage."
    ],
    "te": [
      "ぐあいが わるいので、せんせいを よんで ください。",
      "I feel sick, so please call the teacher."
    ],
    "ta": [
      "たんじょうびかいに ともだちを よんだ。",
      "I invited my friends to my birthday party."
    ],
    "nai": [
      "よる おそいので、いまは たくしーを よばない。",
      "It is late at night, so I will not call a taxi now."
    ]
  },
  "よむ": {
    "masu": [
      "ねるまえに ほんを よみます。",
      "I read a book before going to bed."
    ],
    "te": [
      "この ぶんを こえに だして よんで ください。",
      "Please read this sentence aloud."
    ],
    "ta": [
      "きのう、おもしろい しょうせつを よんだ。",
      "Yesterday, I read an interesting novel."
    ],
    "nai": [
      "じかんが ないので、きょうは しんぶんを よまない。",
      "I do not have time, so I will not read the newspaper today."
    ]
  },
  "わかる": {
    "masu": [
      "せんせいの せつめいが よく わかります。",
      "I understand the teacher's explanation well."
    ],
    "te": [
      "やっと もんだいの いみが わかって、こたえられました。",
      "I finally understood the meaning of the question and could answer it."
    ],
    "ta": [
      "せつめいを きいて、つかいかたが わかった。",
      "After hearing the explanation, I understood how to use it."
    ],
    "nai": [
      "この ことばの いみが わからない。",
      "I do not understand the meaning of this word."
    ]
  },
  "たべる": {
    "masu": [
      "まいあさ、ぱんと くだものを たべます。",
      "I eat bread and fruit every morning."
    ],
    "te": [
      "あさごはんを たべてから、しごとへ いきます。",
      "I eat breakfast and then go to work."
    ],
    "ta": [
      "きのう、はじめて なっとうを たべた。",
      "Yesterday, I ate natto for the first time."
    ],
    "nai": [
      "よる おそくは なにも たべない。",
      "I do not eat anything late at night."
    ]
  },
  "みる": {
    "masu": [
      "よる、かぞくと てれびを みます。",
      "I watch television with my family at night."
    ],
    "te": [
      "この しゃしんを みて ください。",
      "Please look at this photo."
    ],
    "ta": [
      "きのう、えいがかんで えいがを みた。",
      "Yesterday, I watched a movie at the cinema."
    ],
    "nai": [
      "ねるまえは すまーとふぉんを みない。",
      "I do not look at my smartphone before bed."
    ]
  },
  "おきる": {
    "masu": [
      "まいあさ ろくじはんに おきます。",
      "I wake up at six thirty every morning."
    ],
    "te": [
      "あさ はやく おきて、さんぽしました。",
      "I woke up early and went for a walk."
    ],
    "ta": [
      "きょうは めざましどけいが なるまえに おきた。",
      "Today, I woke up before the alarm rang."
    ],
    "nai": [
      "あしたは やすみなので、はやく おきない。",
      "Tomorrow is my day off, so I will not wake up early."
    ]
  },
  "ねる": {
    "masu": [
      "まいばん じゅういちじごろ ねます。",
      "I go to bed around eleven every night."
    ],
    "te": [
      "つかれたので、はやく ねて ください。",
      "You are tired, so please go to bed early."
    ],
    "ta": [
      "きのうは じゅうじかん ねた。",
      "Yesterday, I slept for ten hours."
    ],
    "nai": [
      "しゅくだいが おわるまで ねない。",
      "I will not go to sleep until I finish my homework."
    ]
  },
  "する": {
    "masu": [
      "まいにち、にほんごの べんきょうを します。",
      "I study Japanese every day."
    ],
    "te": [
      "しゅくだいを してから、てれびを みます。",
      "I do my homework and then watch television."
    ],
    "ta": [
      "きのう、へやの そうじを した。",
      "Yesterday, I cleaned my room."
    ],
    "nai": [
      "きょうは ざんぎょうを しない。",
      "I will not work overtime today."
    ]
  },
  "きく（せんせいに）": {
    "masu": [
      "わからない ことを せんせいに ききます。",
      "I ask the teacher about things I do not understand."
    ],
    "te": [
      "こたえが わからなかったら、せんせいに きいて ください。",
      "If you do not know the answer, please ask the teacher."
    ],
    "ta": [
      "じゅぎょうの あとで、せんせいに しつもんを きいた。",
      "After class, I asked the teacher a question."
    ],
    "nai": [
      "じぶんで かんがえるまえに、すぐ せんせいに きかない。",
      "I do not ask the teacher immediately before thinking for myself."
    ]
  },
  "きる": {
    "masu": [
      "ないふで やさいを きります。",
      "I cut vegetables with a knife."
    ],
    "te": [
      "この かみを はさみで きって ください。",
      "Please cut this paper with scissors."
    ],
    "ta": [
      "ばんごはんの ために たまねぎを きった。",
      "I cut an onion for dinner."
    ],
    "nai": [
      "あぶないので、その ひもは きらないで ください。",
      "It is dangerous, so please do not cut that string."
    ]
  },
  "さわる（どあに）": {
    "masu": [
      "へやに はいるとき、どあに さわります。",
      "I touch the door when entering the room."
    ],
    "te": [
      "この どあに さわって、あつくないか たしかめました。",
      "I touched the door to check whether it was hot."
    ],
    "ta": [
      "ぬれた てで どあに さわった。",
      "I touched the door with wet hands."
    ],
    "nai": [
      "ぺんきが かわいていないので、どあに さわらないで ください。",
      "The paint is not dry, so please do not touch the door."
    ]
  },
  "しる": {
    "masu": [
      "にゅーすを みて、その じじつを しります。",
      "I learn that fact from the news."
    ],
    "te": [
      "かれの しごとを しって、おどろきました。",
      "I learned what his job was and was surprised."
    ],
    "ta": [
      "きのう、はじめて その みせを しった。",
      "Yesterday, I learned about that shop for the first time."
    ],
    "nai": [
      "その ひとの なまえを まだ しらない。",
      "I do not know that person's name yet."
    ]
  },
  "すう（たばこを）": {
    "masu": [
      "かれは そとで たばこを すいます。",
      "He smokes outside."
    ],
    "te": [
      "たばこを すってから、へやに もどりました。",
      "He smoked a cigarette and then returned to the room."
    ],
    "ta": [
      "むかし、ちちは たばこを すった。",
      "My father used to smoke."
    ],
    "nai": [
      "けんこうの ために、たばこを すわない。",
      "I do not smoke for the sake of my health."
    ]
  },
  "すむ": {
    "masu": [
      "わたしは とうきょうに すんでいます。",
      "I live in Tokyo."
    ],
    "te": [
      "えきの ちかくに すんで、でんしゃで かよっています。",
      "I live near the station and commute by train."
    ],
    "ta": [
      "こどもの ころ、おおさかに すんだ。",
      "I lived in Osaka when I was a child."
    ],
    "nai": [
      "しょうらいも ずっと この まちには すまない。",
      "I will not live in this town forever."
    ]
  },
  "だす": {
    "masu": [
      "あしたまでに しゅくだいを だします。",
      "I will hand in my homework by tomorrow."
    ],
    "te": [
      "ぱすぽーとを かばんから だして ください。",
      "Please take your passport out of your bag."
    ],
    "ta": [
      "きのう、ゆうびんきょくで てがみを だした。",
      "Yesterday, I mailed a letter at the post office."
    ],
    "nai": [
      "まだ かんせいしていないので、しょるいを ださない。",
      "The document is not finished, so I will not submit it."
    ]
  },
  "つく": {
    "masu": [
      "でんしゃは くじに とうきょうえきへ つきます。",
      "The train arrives at Tokyo Station at nine."
    ],
    "te": [
      "えきに ついてから、でんわして ください。",
      "Please call me after you arrive at the station."
    ],
    "ta": [
      "よていより はやく ほてるに ついた。",
      "I arrived at the hotel earlier than planned."
    ],
    "nai": [
      "じゅうたいしているので、ろくじまでには つかない。",
      "There is traffic, so I will not arrive by six."
    ]
  },
  "つくる": {
    "masu": [
      "まいばん、うちで ばんごはんを つくります。",
      "I make dinner at home every evening."
    ],
    "te": [
      "さらだを つくって、みんなで たべました。",
      "I made a salad and everyone ate it together."
    ],
    "ta": [
      "きのう、はじめて かれーを つくった。",
      "Yesterday, I made curry for the first time."
    ],
    "nai": [
      "きょうは つかれたので、ばんごはんを つくらない。",
      "I am tired today, so I will not make dinner."
    ]
  },
  "つれていく": {
    "masu": [
      "にちようびに こどもを どうぶつえんへ つれていきます。",
      "I will take my child to the zoo on Sunday."
    ],
    "te": [
      "この こを えきまで つれていって ください。",
      "Please take this child to the station."
    ],
    "ta": [
      "きのう、いぬを こうえんへ つれていった。",
      "Yesterday, I took my dog to the park."
    ],
    "nai": [
      "あぶないので、こどもを そこへ つれていかない。",
      "It is dangerous, so I will not take the child there."
    ]
  },
  "てつだう": {
    "masu": [
      "まいばん、ははの りょうりを てつだいます。",
      "I help my mother cook every evening."
    ],
    "te": [
      "にもつを はこぶのを てつだって ください。",
      "Please help me carry the luggage."
    ],
    "ta": [
      "きのう、ともだちの ひっこしを てつだった。",
      "Yesterday, I helped my friend move."
    ],
    "nai": [
      "じぶんで できるそうなので、こんかいは てつだわない。",
      "It looks like they can do it themselves, so I will not help this time."
    ]
  },
  "とまる（ほてるに）": {
    "masu": [
      "こんやは えきの ちかくの ほてるに とまります。",
      "I will stay at a hotel near the station tonight."
    ],
    "te": [
      "きょうとで ににち とまって、てらを みました。",
      "I stayed in Kyoto for two days and visited temples."
    ],
    "ta": [
      "せんしゅう、うみの ちかくの ほてるに とまった。",
      "Last week, I stayed at a hotel near the sea."
    ],
    "nai": [
      "ひがえりなので、ほてるには とまらない。",
      "It is a day trip, so I will not stay at a hotel."
    ]
  },
  "とる（しゃしんを）": {
    "masu": [
      "りょこうでは たくさん しゃしんを とります。",
      "I take many photos while traveling."
    ],
    "te": [
      "ここで かぞくの しゃしんを とって ください。",
      "Please take a photo of my family here."
    ],
    "ta": [
      "きのう、さくらの しゃしんを とった。",
      "Yesterday, I took a photo of the cherry blossoms."
    ],
    "nai": [
      "びじゅつかんの なかでは しゃしんを とらないで ください。",
      "Please do not take photos inside the museum."
    ]
  },
  "なおる": {
    "masu": [
      "くすりを のめば、かぜは すぐ なおります。",
      "If you take the medicine, your cold will get better soon."
    ],
    "te": [
      "ぱそこんが なおって、また つかえるように なりました。",
      "The computer was fixed, so I can use it again."
    ],
    "ta": [
      "やっと けがが なおった。",
      "My injury finally healed."
    ],
    "nai": [
      "この こしょうは かんたんには なおらない。",
      "This problem will not be fixed easily."
    ]
  },
  "なくす": {
    "masu": [
      "わたしは よく かぎを なくします。",
      "I often lose my keys."
    ],
    "te": [
      "さいふを なくして、けいさつへ いきました。",
      "I lost my wallet and went to the police."
    ],
    "ta": [
      "きのう、でんしゃの なかで かさを なくした。",
      "Yesterday, I lost my umbrella on the train."
    ],
    "nai": [
      "たいせつな しょるいなので、ぜったいに なくさない。",
      "It is an important document, so I will definitely not lose it."
    ]
  },
  "ならう": {
    "masu": [
      "まいしゅう、せんせいに にほんごを ならいます。",
      "I learn Japanese from a teacher every week."
    ],
    "te": [
      "せんせいに りょうりを ならって、うちで れんしゅうしました。",
      "I learned cooking from a teacher and practiced at home."
    ],
    "ta": [
      "こどもの ころ、ぴあのを ならった。",
      "I learned piano when I was a child."
    ],
    "nai": [
      "ことしは いそがしいので、あたらしい ことは ならわない。",
      "I am busy this year, so I will not take up anything new."
    ]
  },
  "なる": {
    "masu": [
      "らいねん、だいがくせいに なります。",
      "I will become a university student next year."
    ],
    "te": [
      "はるに なって、あたたかく なりました。",
      "Spring came, and it became warm."
    ],
    "ta": [
      "いもうとは ことし はたちに なった。",
      "My younger sister turned twenty this year."
    ],
    "nai": [
      "れんしゅうしなければ、じょうずには ならない。",
      "You will not improve unless you practice."
    ]
  },
  "ぬぐ": {
    "masu": [
      "いえに はいるまえに くつを ぬぎます。",
      "I take off my shoes before entering the house."
    ],
    "te": [
      "ここで くつを ぬいで ください。",
      "Please take off your shoes here."
    ],
    "ta": [
      "あつかったので、うわぎを ぬいだ。",
      "It was hot, so I took off my jacket."
    ],
    "nai": [
      "さむいので、こーとは ぬがない。",
      "It is cold, so I will not take off my coat."
    ]
  },
  "のぼる": {
    "masu": [
      "らいしゅう、ふじさんに のぼります。",
      "I will climb Mount Fuji next week."
    ],
    "te": [
      "かいだんを のぼって、にかいへ いきました。",
      "I went up the stairs to the second floor."
    ],
    "ta": [
      "きのう、ちいさい やまに のぼった。",
      "Yesterday, I climbed a small mountain."
    ],
    "nai": [
      "てんきが わるいので、きょうは やまに のぼらない。",
      "The weather is bad, so I will not climb the mountain today."
    ]
  },
  "のむ（くすりを）": {
    "masu": [
      "まいにち、しょくごに くすりを のみます。",
      "I take medicine after meals every day."
    ],
    "te": [
      "この くすりを のんで、ゆっくり やすんで ください。",
      "Please take this medicine and get plenty of rest."
    ],
    "ta": [
      "あさごはんの あとで くすりを のんだ。",
      "I took the medicine after breakfast."
    ],
    "nai": [
      "いしゃに きくまで、この くすりは のまない。",
      "I will not take this medicine until I ask the doctor."
    ]
  },
  "のる": {
    "masu": [
      "まいあさ、しんじゅくで でんしゃに のります。",
      "I get on the train at Shinjuku every morning."
    ],
    "te": [
      "ばすに のって、えきまで いきました。",
      "I took the bus to the station."
    ],
    "ta": [
      "きのう、はじめて しんかんせんに のった。",
      "Yesterday, I rode the bullet train for the first time."
    ],
    "nai": [
      "こんでいるので、この でんしゃには のらない。",
      "This train is crowded, so I will not get on it."
    ]
  },
  "はいる（だいがくに）": {
    "masu": [
      "らいねん、にほんの だいがくに はいります。",
      "I will enter a Japanese university next year."
    ],
    "te": [
      "だいがくに はいって、けいざいを べんきょうしました。",
      "I entered university and studied economics."
    ],
    "ta": [
      "あには きょねん だいがくに はいった。",
      "My older brother entered university last year."
    ],
    "nai": [
      "ことしは まだ だいがくに はいらない。",
      "I will not enter university this year."
    ]
  },
  "はいる（きっさてんに）": {
    "masu": [
      "つかれたとき、えきまえの きっさてんに はいります。",
      "When I am tired, I go into the cafe in front of the station."
    ],
    "te": [
      "きっさてんに はいって、こーひーを のみました。",
      "I went into a cafe and drank coffee."
    ],
    "ta": [
      "あめが ふってきたので、きっさてんに はいった。",
      "It started raining, so I went into a cafe."
    ],
    "nai": [
      "じかんが ないので、きっさてんには はいらない。",
      "I do not have time, so I will not go into a cafe."
    ]
  },
  "はく": {
    "masu": [
      "しごとへ いくとき、くろい くつを はきます。",
      "I wear black shoes when I go to work."
    ],
    "te": [
      "そとへ でるまえに、くつを はいて ください。",
      "Please put on your shoes before going outside."
    ],
    "ta": [
      "きのう、あたらしい ずぼんを はいた。",
      "Yesterday, I wore new trousers."
    ],
    "nai": [
      "うちの なかでは くつを はかない。",
      "I do not wear shoes inside the house."
    ]
  },
  "はたらく": {
    "masu": [
      "ちちは ぎんこうで はたらいています。",
      "My father works at a bank."
    ],
    "te": [
      "にほんで はたらいて、いろいろな けいけんを しました。",
      "I worked in Japan and gained many experiences."
    ],
    "ta": [
      "きのうは よる おそくまで はたらいた。",
      "Yesterday, I worked until late at night."
    ],
    "nai": [
      "にちようびは はたらかない。",
      "I do not work on Sundays."
    ]
  },
  "ひく": {
    "masu": [
      "まいばん、ぴあのを ひきます。",
      "I play the piano every evening."
    ],
    "te": [
      "この きょくを ぴあので ひいて ください。",
      "Please play this piece on the piano."
    ],
    "ta": [
      "こどもの ころ、よく ぎたーを ひいた。",
      "I often played the guitar when I was a child."
    ],
    "nai": [
      "よる おそくは ぴあのを ひかない。",
      "I do not play the piano late at night."
    ]
  },
  "ふる": {
    "masu": [
      "あしたは あめが ふります。",
      "It will rain tomorrow."
    ],
    "te": [
      "あめが ふって、しあいが ちゅうしに なりました。",
      "It rained, so the game was canceled."
    ],
    "ta": [
      "きのう、あさから ゆきが ふった。",
      "Yesterday, it snowed from the morning."
    ],
    "nai": [
      "てんきよほうでは、きょうは あめが ふらない。",
      "According to the forecast, it will not rain today."
    ]
  },
  "まがる": {
    "masu": [
      "つぎの かどを みぎに まがります。",
      "I turn right at the next corner."
    ],
    "te": [
      "しんごうを ひだりに まがって ください。",
      "Please turn left at the traffic light."
    ],
    "ta": [
      "みちを まちがえて、ちがう かどを まがった。",
      "I took a wrong turn at a different corner."
    ],
    "nai": [
      "ここでは みぎに まがらないで ください。",
      "Please do not turn right here."
    ]
  },
  "まわす": {
    "masu": [
      "どあの とってを みぎに まわします。",
      "I turn the door handle to the right."
    ],
    "te": [
      "つまみを ゆっくり まわして ください。",
      "Please turn the knob slowly."
    ],
    "ta": [
      "かぎを ひだりに まわした。",
      "I turned the key to the left."
    ],
    "nai": [
      "こわれるので、むりに まわさないで ください。",
      "It may break, so please do not force it to turn."
    ]
  },
  "もつ": {
    "masu": [
      "でかけるとき、いつも かさを もちます。",
      "I always carry an umbrella when I go out."
    ],
    "te": [
      "この にもつを もって ください。",
      "Please hold this luggage."
    ],
    "ta": [
      "りょうてに おおきな かばんを もった。",
      "I held a large bag in both hands."
    ],
    "nai": [
      "きょうは にもつを もたない。",
      "I will not carry any luggage today."
    ]
  },
  "もっていく": {
    "masu": [
      "がっこうへ おべんとうを もっていきます。",
      "I take a lunch box to school."
    ],
    "te": [
      "この しょるいを じむしょへ もっていって ください。",
      "Please take this document to the office."
    ],
    "ta": [
      "ぴくにっくに みずと ぱんを もっていった。",
      "I took water and bread to the picnic."
    ],
    "nai": [
      "にもつが おもいので、これは もっていかない。",
      "This is heavy, so I will not take it."
    ]
  },
  "もらう": {
    "masu": [
      "たんじょうびに ともだちから ぷれぜんとを もらいます。",
      "I receive a present from my friend on my birthday."
    ],
    "te": [
      "せんせいに さくぶんを みて もらって、なおしました。",
      "I had my teacher check my essay and then corrected it."
    ],
    "ta": [
      "きのう、かいしゃから しりょうを もらった。",
      "Yesterday, I received some materials from the company."
    ],
    "nai": [
      "ひつようが ないので、れしーとは もらわない。",
      "I do not need it, so I will not take a receipt."
    ]
  },
  "やくにたつ": {
    "masu": [
      "この じしょは にほんごの べんきょうに やくにたちます。",
      "This dictionary is useful for studying Japanese."
    ],
    "te": [
      "この けいけんが しごとで やくにたって、うれしかったです。",
      "I was happy that this experience proved useful at work."
    ],
    "ta": [
      "その じょうほうは りょこうで とても やくにたった。",
      "That information was very useful during the trip."
    ],
    "nai": [
      "ふるすぎる じょうほうは あまり やくにたたない。",
      "Information that is too old is not very useful."
    ]
  },
  "やすむ": {
    "masu": [
      "にちようびは うちで ゆっくり やすみます。",
      "I rest at home on Sundays."
    ],
    "te": [
      "つかれているので、すこし やすんで ください。",
      "You are tired, so please rest for a while."
    ],
    "ta": [
      "きのうは いちにち うちで やすんだ。",
      "Yesterday, I rested at home all day."
    ],
    "nai": [
      "いそがしくても、ひるやすみには ぜんぜん やすまない。",
      "Even when I am busy, I do not skip my lunch break entirely."
    ]
  },
  "やすむ（しごとを）": {
    "masu": [
      "あしたは びょういんへ いくので、しごとを やすみます。",
      "I will take a day off work tomorrow to go to the hospital."
    ],
    "te": [
      "きのうは ねつが あって、しごとを やすんだ。",
      "Yesterday, I had a fever and took the day off work."
    ],
    "ta": [
      "せんしゅう、かぜで しごとを やすんだ。",
      "Last week, I took time off work because of a cold."
    ],
    "nai": [
      "いそがしい じきなので、こんげつは しごとを やすまない。",
      "It is a busy season, so I will not take any days off work this month."
    ]
  },
  "わたる（はしを）": {
    "masu": [
      "まいあさ、この はしを わたります。",
      "I cross this bridge every morning."
    ],
    "te": [
      "はしを わたって、ひだりへ まがって ください。",
      "Cross the bridge and turn left."
    ],
    "ta": [
      "きのう、あるいて ながい はしを わたった。",
      "Yesterday, I crossed a long bridge on foot."
    ],
    "nai": [
      "あぶないので、よるは この はしを わたらない。",
      "It is dangerous, so I do not cross this bridge at night."
    ]
  },
  "くる": {
    "masu": [
      "あした、ともだちが うちへ きます。",
      "My friend will come to my house tomorrow."
    ],
    "te": [
      "じかんが あるとき、また あそびに きて ください。",
      "Please come visit again when you have time."
    ],
    "ta": [
      "きのう、いもうとが とうきょうから きた。",
      "Yesterday, my younger sister came from Tokyo."
    ],
    "nai": [
      "きょうは たんとうしゃが こない。",
      "The person in charge is not coming today."
    ]
  }
};

    const safeStorage = {
      get(key, fallback) {
        try {
          const value = window.localStorage.getItem(key);
          return value === null ? fallback : value;
        } catch (error) {
          console.warn("localStorage is not available in this browser.", error);
          return fallback;
        }
      },
      set(key, value) {
        try {
          window.localStorage.setItem(key, value);
        } catch (error) {
          console.warn("Could not save progress in this browser.", error);
        }
      }
    };

    const state = {
      currentVerb: null,
      currentForm: null,
      answered: false,
      questionNumber: 0,
      correct: Number(safeStorage.get("verbQuizCorrect", "0") || 0),
      total: Number(safeStorage.get("verbQuizTotal", "0") || 0),
      wrongKeys: new Set((function () {
        try {
          return JSON.parse(safeStorage.get("verbQuizWrong", "[]") || "[]");
        } catch (error) {
          return [];
        }
      })()),
      sessionQuestions: [],
      sessionIndex: 0,
      sessionCorrect: 0,
      sessionFinished: false
    };

    const dictionaryForm = document.getElementById("dictionaryForm");
    const meaning = document.getElementById("meaning");
    const prompt = document.getElementById("prompt");
    const answerInput = document.getElementById("answerInput");
    const result = document.getElementById("result");
    const checkButton = document.getElementById("checkButton");
    const nextButton = document.getElementById("nextButton");
    const showAnswerButton = document.getElementById("showAnswerButton");
    const gameMode = document.getElementById("gameMode");
    const questionOrder = document.getElementById("questionOrder");
    const sourceTextbook = document.getElementById("sourceTextbook");
    const sourceLevel = document.getElementById("sourceLevel");
    const verbGroup = document.getElementById("verbGroup");
    const formChoices = [...document.querySelectorAll('input[name="formChoice"]')];
    const modeMessage = document.getElementById("modeMessage");
    const startButton = document.getElementById("startButton");
    const questionNumber = document.getElementById("questionNumber");
    const correctCount = document.getElementById("correctCount");
    const totalCount = document.getElementById("totalCount");
    const accuracy = document.getElementById("accuracy");
    const resetStatsButton = document.getElementById("resetStatsButton");
    const resetWrongButton = document.getElementById("resetWrongButton");
    const syncStatus = document.getElementById("syncStatus");
    const quizViewButton = document.getElementById("quizViewButton");
    const listViewButton = document.getElementById("listViewButton");
    const quizView = document.getElementById("quizView");
    const listView = document.getElementById("listView");
    const listTextbook = document.getElementById("listTextbook");
    const listLevel = document.getElementById("listLevel");
    const listVerbGroup = document.getElementById("listVerbGroup");
    const listSummary = document.getElementById("listSummary");
    const verbTableBody = document.getElementById("verbTableBody");
    const emptyListMessage = document.getElementById("emptyListMessage");

    function setSyncStatus(message) {
      syncStatus.textContent = message;
    }

    function initFirebase() {
      if (!firebaseReady) {
        syncEnabled = false;
        setSyncStatus("Firebase: 未設定のため内蔵データ / Built-in data");
        return false;
      }

      try {
        const app = initializeApp(firebaseConfig);
        firestore = getFirestore(app);
        syncEnabled = true;
        setSyncStatus("Firebase: 動詞DBに接続 / Verb database connected");
        return true;
      } catch (error) {
        console.error("Firebase initialization failed.", error);
        syncEnabled = false;
        setSyncStatus("Firebase: 接続できません。内蔵データを使います / Built-in data");
        return false;
      }
    }

    async function loadRemoteVerbs() {
      if (!syncEnabled) return;

      try {
        const snapshot = await getDocs(collection(firestore, "verbs"));
        const remoteVerbs = snapshot.docs
          .map((item) => normalizeVerbDoc(item.id, item.data()))
          .filter((verb) =>
            verb.dictionary &&
            verb.meaning &&
            verb.masu &&
            verb.te &&
            verb.ta &&
            verb.nai
          )
          .sort(compareVerbs);

        if (remoteVerbs.length > 0) {
          verbs = remoteVerbs;
          setSyncStatus(`Firebase: ${remoteVerbs.length}件の動詞を読み込み / ${remoteVerbs.length} verbs loaded`);
        }
      } catch (error) {
        console.error("Could not load verbs from Firestore.", error);
        setSyncStatus("Firebase: 動詞DBを読めません。内蔵データを使います / Built-in verbs");
      }
    }

    function normalizeVerbDoc(id, data) {
      const forms = data.forms || {};

      return {
        ...defaultSource,
        id,
        ...data,
        dictionary: data.dictionary || "",
        meaning: data.meaning || "",
        masu: data.masu || forms.masu || "",
        te: data.te || forms.te || "",
        ta: data.ta || forms.ta || "",
        nai: data.nai || forms.nai || "",
        examples: data.examples || {}
      };
    }

    function normalize(value) {
      return value
        .trim()
        .replace(/\s+/g, "")
        .normalize("NFKC");
    }

    function isHiragana(value) {
      return /^[ぁ-んー]+$/.test(value);
    }

    function randomItem(items) {
      return items[Math.floor(Math.random() * items.length)];
    }

    function compareVerbs(a, b) {
      const sourceCompare = String(a.textbookId || "").localeCompare(String(b.textbookId || ""), "ja") ||
        String(a.levelId || "").localeCompare(String(b.levelId || ""), "ja") ||
        String(a.verbGroupId || "").localeCompare(String(b.verbGroupId || ""), "ja");
      if (sourceCompare !== 0) return sourceCompare;

      const orderA = Number.isFinite(a.order) ? a.order : Number.MAX_SAFE_INTEGER;
      const orderB = Number.isFinite(b.order) ? b.order : Number.MAX_SAFE_INTEGER;
      return orderA - orderB || String(a.dictionary).localeCompare(String(b.dictionary), "ja");
    }

    function makeOptionLabel(item, idKey, nameKey) {
      return item[nameKey] || item[idKey];
    }

    function populateSelect(select, items, idKey, nameKey) {
      const currentValue = select.value;
      const seen = new Map();

      for (const item of items) {
        const id = item[idKey];
        if (!id || seen.has(id)) continue;
        seen.set(id, makeOptionLabel(item, idKey, nameKey));
      }

      select.innerHTML = "<option value=\"all\">すべて / All</option>";
      for (const [id, label] of [...seen.entries()].sort((a, b) => a[1].localeCompare(b[1], "ja"))) {
        const option = document.createElement("option");
        option.value = id;
        option.textContent = label;
        select.appendChild(option);
      }

      select.value = seen.has(currentValue) ? currentValue : "all";
    }

    function populateFilters() {
      populateSelect(sourceTextbook, verbs, "textbookId", "textbookName");
      populateSelect(sourceLevel, verbs, "levelId", "levelName");
      populateSelect(verbGroup, verbs, "verbGroupId", "verbGroupName");
      populateSelect(listTextbook, verbs, "textbookId", "textbookName");
      populateSelect(listLevel, verbs, "levelId", "levelName");
      populateSelect(listVerbGroup, verbs, "verbGroupId", "verbGroupName");
    }

    function makeKey(verb, form) {
      return `${verb.dictionary}:${form}`;
    }

    function getSelectedForms() {
      return formChoices.filter((item) => item.checked).map((item) => item.value);
    }

    function matchesSelectedSource(verb) {
      return (sourceTextbook.value === "all" || verb.textbookId === sourceTextbook.value) &&
        (sourceLevel.value === "all" || verb.levelId === sourceLevel.value) &&
        (verbGroup.value === "all" || verb.verbGroupId === verbGroup.value);
    }

    function matchesListSource(verb) {
      return (listTextbook.value === "all" || verb.textbookId === listTextbook.value) &&
        (listLevel.value === "all" || verb.levelId === listLevel.value) &&
        (listVerbGroup.value === "all" || verb.verbGroupId === listVerbGroup.value);
    }

    function getAvailableQuestions() {
      const forms = getSelectedForms();

      if (forms.length === 0) {
        return [];
      }

      const allQuestions = [];
      for (const verb of verbs.filter(matchesSelectedSource)) {
        for (const form of forms) {
          allQuestions.push({ verb, form });
        }
      }

      if (gameMode.value === "wrong") {
        return allQuestions.filter(({ verb, form }) =>
          state.wrongKeys.has(makeKey(verb, form))
        );
      }

      return allQuestions;
    }

    function shuffle(items) {
      const copy = [...items];
      for (let i = copy.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    }

    function startSession() {
      const questions = getAvailableQuestions();

      state.questionNumber = 0;
      state.sessionIndex = 0;
      state.sessionCorrect = 0;
      state.sessionFinished = false;
      modeMessage.className = "mode-message";
      modeMessage.innerHTML = "";

      if (questions.length === 0) {
        dictionaryForm.textContent = "—";
        meaning.textContent = "";
        prompt.className = "prompt";
        prompt.innerHTML = gameMode.value === "wrong"
          ? "ふくしゅうする まちがいもんだいが ありません<br><span lang=\"en\">There are no wrong answers to review.</span>"
          : "かつようけいを ひとつ いじょう えらんでください<br><span lang=\"en\">Choose at least one form.</span>";
        answerInput.value = "";
        answerInput.disabled = true;
        checkButton.classList.add("hidden");
        nextButton.classList.add("hidden");
        showAnswerButton.classList.add("hidden");
        result.className = "result";
        result.innerHTML = "";
        return;
      }

      let prepared = questionOrder.value === "random" ? shuffle(questions) : [...questions];

      if (gameMode.value === "ten") {
        prepared = prepared.slice(0, Math.min(10, prepared.length));
      }

      state.sessionQuestions = prepared;
      newQuestion();
    }

    function finishSession(messageJa, messageEn) {
      state.sessionFinished = true;
      answerInput.disabled = true;
      checkButton.classList.add("hidden");
      showAnswerButton.classList.add("hidden");
      nextButton.classList.add("hidden");
      modeMessage.className = "mode-message show";
      modeMessage.innerHTML = `
        ${messageJa}<br><span lang="en">${messageEn}</span>
        <br>
        <button type="button" id="retryButton" class="primary retry-button">
          もう いちど ちょうせんする
          <br><span lang="en">Try again</span>
        </button>
      `;

      const retryButton = document.getElementById("retryButton");
      if (retryButton) {
        retryButton.addEventListener("click", startSession);
        retryButton.focus();
      }
    }

    function newQuestion() {
      if (state.sessionFinished) return;

      if (gameMode.value === "ten" && state.sessionIndex >= state.sessionQuestions.length) {
        finishSession(
          `10もん おわりました。せいかいは ${state.sessionCorrect}もんです。`,
          `You finished 10 questions. You got ${state.sessionCorrect} correct.`
        );
        return;
      }

      if (gameMode.value === "wrong" && state.sessionIndex >= state.sessionQuestions.length) {
        finishSession(
          `まちがえた もんだいの れんしゅうが おわりました。`,
          `You finished reviewing the wrong answers.`
        );
        return;
      }

      let selected;

      if (gameMode.value === "free" || gameMode.value === "sudden") {
        const questions = getAvailableQuestions();
        if (questions.length === 0) {
          startSession();
          return;
        }

        if (questionOrder.value === "random") {
          selected = randomItem(questions);
        } else {
          selected = questions[state.sessionIndex % questions.length];
        }
      } else {
        selected = state.sessionQuestions[state.sessionIndex];
      }

      state.currentVerb = selected.verb;
      state.currentForm = selected.form;
      state.answered = false;
      state.questionNumber += 1;

      dictionaryForm.textContent = state.currentVerb.dictionary;
      meaning.textContent = state.currentVerb.meaning;
      const targetForm = formDisplay[state.currentForm];
      prompt.className = `prompt form-${state.currentForm}`;
      prompt.innerHTML = `
        <span class="target-form-label">こたえる かたち / FORM TO ENTER</span>
        <span class="target-form-name">${targetForm.ja}</span>
        <span class="target-form-en" lang="en">${targetForm.en}</span>
      `;
      answerInput.placeholder = `${targetForm.ja}を ひらがなで にゅうりょく`;

      if (gameMode.value === "ten") {
        questionNumber.textContent = `${state.sessionIndex + 1} / ${state.sessionQuestions.length}`;
      } else if (gameMode.value === "sudden") {
        questionNumber.textContent = `れんぞく ${state.sessionCorrect}もん せいかい / ${state.sessionCorrect} correct in a row`;
      } else {
        questionNumber.textContent = `だい${state.questionNumber}もん / Question ${state.questionNumber}`;
      }

      answerInput.disabled = false;
      answerInput.value = "";
      answerInput.focus();

      result.className = "result";
      result.innerHTML = "";

      checkButton.classList.remove("hidden");
      nextButton.classList.add("hidden");
      showAnswerButton.classList.remove("hidden");
    }

    function saveLocalProgress() {
      safeStorage.set("verbQuizCorrect", String(state.correct));
      safeStorage.set("verbQuizTotal", String(state.total));
      safeStorage.set("verbQuizWrong", JSON.stringify(Array.from(state.wrongKeys)));
    }

    function saveProgress() {
      saveLocalProgress();
    }

    function updateStats() {
      correctCount.textContent = state.correct;
      totalCount.textContent = state.total;
      accuracy.textContent = state.total === 0
        ? "0%"
        : `${Math.round((state.correct / state.total) * 100)}%`;
    }

    function escapeHtml(value) {
      return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    }

    function getExamplePair(verb, form) {
      const exampleGroup = verb.examples || exampleSentences[verb.dictionary];
      const rawExample = exampleGroup && exampleGroup[form];

      if (!rawExample) {
        return [`${verb[form]}。`, verb.meaning];
      }

      return Array.isArray(rawExample)
        ? rawExample
        : [rawExample.ja || `${verb[form]}。`, rawExample.en || verb.meaning];
    }

    function getExamplesTableHtml(verb) {
      return ["masu", "te", "ta", "nai"].map((form) => {
        const example = getExamplePair(verb, form);
        return `
          <div class="example-line">
            <div class="example-form">${escapeHtml(formLabels[form])}</div>
            <div class="example-table-ja">${escapeHtml(example[0])}</div>
            <div class="example-table-en" lang="en">${escapeHtml(example[1])}</div>
          </div>
        `;
      }).join("");
    }

    function renderVerbList() {
      const filteredVerbs = verbs
        .filter(matchesListSource)
        .sort(compareVerbs);

      listSummary.textContent = `${filteredVerbs.length} verbs`;
      emptyListMessage.classList.toggle("hidden", filteredVerbs.length > 0);

      verbTableBody.innerHTML = filteredVerbs.map((verb) => `
        <tr>
          <td data-label="じしょけい">
            <div class="verb-main">${escapeHtml(verb.dictionary)}</div>
            <div class="verb-meta">${escapeHtml(verb.verbGroupName || "")}</div>
          </td>
          <td data-label="いみ">${escapeHtml(verb.meaning)}</td>
          <td data-label="ます" class="form-cell">${escapeHtml(verb.masu)}</td>
          <td data-label="て" class="form-cell">${escapeHtml(verb.te)}</td>
          <td data-label="た" class="form-cell">${escapeHtml(verb.ta)}</td>
          <td data-label="ない" class="form-cell">${escapeHtml(verb.nai)}</td>
          <td data-label="れいぶん" class="examples-cell">
            <div class="examples-list">${getExamplesTableHtml(verb)}</div>
          </td>
        </tr>
      `).join("");
    }

    function setActiveView(viewName) {
      const isListView = viewName === "list";
      quizView.classList.toggle("hidden", isListView);
      listView.classList.toggle("hidden", !isListView);
      quizViewButton.classList.toggle("active", !isListView);
      listViewButton.classList.toggle("active", isListView);

      if (isListView) {
        renderVerbList();
      } else {
        answerInput.focus();
      }
    }

    function getExampleHtml(verb, form) {
      const example = getExamplePair(verb, form);

      return `
        <div class="example-box">
          <div class="example-title">れいぶん / Example sentence</div>
          <div class="example-ja">${escapeHtml(example[0])}</div>
          <div class="example-en" lang="en">${escapeHtml(example[1])}</div>
        </div>
      `;
    }

    function safeExampleHtml(verb, form) {
      try {
        return getExampleHtml(verb, form);
      } catch (error) {
        console.error(error);
        return `
          <div class="example-box">
            <div class="example-title">れいぶん / Example sentence</div>
            <div class="example-ja">${escapeHtml(verb[form])}</div>
            <div class="example-en" lang="en">${escapeHtml(verb.meaning)}</div>
          </div>
        `;
      }
    }

    function finishQuestion(isCorrect, userAnswer, counted = true) {
      const correctAnswer = state.currentVerb[state.currentForm];
      const key = makeKey(state.currentVerb, state.currentForm);

      state.answered = true;
      answerInput.disabled = true;

      if (counted) {
        state.total += 1;
        if (isCorrect) {
          state.correct += 1;
          state.wrongKeys.delete(key);
        } else {
          state.wrongKeys.add(key);
        }
      }

      if (isCorrect) {
        result.className = "result correct";
        result.innerHTML = `
          <div class="result-title">○ せいかい！ <span lang="en">Correct!</span></div>
          <div class="answer-line">
            <span class="correct-answer-big">${correctAnswer}</span>
          </div>
          ${safeExampleHtml(state.currentVerb, state.currentForm)}
        `;
      } else {
        result.className = "result incorrect";
        result.innerHTML = `
          <div class="result-title">${counted ? "× ふせいかい / Incorrect" : "こたえ / Answer"}</div>
          ${counted ? `<div>あなたの こたえ / Your answer: ${userAnswer || "みとうにゅう / No answer"}</div>` : ""}
          <div class="answer-line">
            <span class="correct-answer-label">ただしい こたえ / Correct answer</span>
            <span class="correct-answer-big">${correctAnswer}</span>
          </div>
          ${safeExampleHtml(state.currentVerb, state.currentForm)}
        `;
      }

      checkButton.classList.add("hidden");
      showAnswerButton.classList.add("hidden");
      nextButton.classList.remove("hidden");
      nextButton.focus();

      if (counted && isCorrect) {
        state.sessionCorrect += 1;
      }

      if (counted && gameMode.value === "sudden" && !isCorrect) {
        saveProgress();
        updateStats();
        finishSession(
          `げーむ おわり。${state.sessionCorrect}もん れんぞくで せいかいしました。`,
          `Game over. You got ${state.sessionCorrect} correct in a row.`
        );
        return;
      }

      if (counted && (gameMode.value === "ten" || gameMode.value === "wrong")) {
        state.sessionIndex += 1;
      } else if (counted && (gameMode.value === "free" || gameMode.value === "sudden")) {
        state.sessionIndex += 1;
      }

      saveProgress();
      updateStats();
    }

    function checkAnswer() {
      if (state.answered || !state.currentVerb) return;

      const rawAnswer = answerInput.value;
      const userAnswer = normalize(rawAnswer);
      const correctAnswer = normalize(state.currentVerb[state.currentForm]);

      if (!userAnswer) {
        result.className = "result incorrect";
        result.innerHTML = `<div class="result-title">こたえを いれてください。<br><span lang="en">Please enter an answer.</span></div>`;
        answerInput.focus();
        return;
      }

      if (!isHiragana(userAnswer)) {
        result.className = "result incorrect";
        result.innerHTML = `<div class="result-title">ひらがなで いれてください。<br><span lang="en">Please type in hiragana.</span></div>`;
        answerInput.focus();
        return;
      }

      finishQuestion(userAnswer === correctAnswer, userAnswer, true);
    }

    checkButton.addEventListener("click", checkAnswer);
    nextButton.addEventListener("click", newQuestion);

    showAnswerButton.addEventListener("click", () => {
      if (!state.answered && state.currentVerb) {
        finishQuestion(false, "", false);
      }
    });

    answerInput.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") return;
      event.preventDefault();

      if (state.answered) {
        newQuestion();
      } else {
        checkAnswer();
      }
    });

    startButton.addEventListener("click", startSession);
    sourceTextbook.addEventListener("change", startSession);
    sourceLevel.addEventListener("change", startSession);
    verbGroup.addEventListener("change", startSession);
    quizViewButton.addEventListener("click", () => setActiveView("quiz"));
    listViewButton.addEventListener("click", () => setActiveView("list"));
    listTextbook.addEventListener("change", renderVerbList);
    listLevel.addEventListener("change", renderVerbList);
    listVerbGroup.addEventListener("change", renderVerbList);

    resetStatsButton.addEventListener("click", () => {
      if (!confirm("せいかいすう・もんだいすうを りせっとしますか？\nReset the score and question count?")) return;
      state.correct = 0;
      state.total = 0;
      saveProgress();
      updateStats();
    });

    resetWrongButton.addEventListener("click", () => {
      if (!confirm("まちがいの きろくを ぜんぶ けしますか？\nDelete all wrong-answer history?")) return;
      state.wrongKeys.clear();
      saveProgress();

      if (gameMode.value === "wrong") {
        startSession();
      }
    });

    async function boot() {
      updateStats();
      answerInput.disabled = true;
      checkButton.classList.add("hidden");
      nextButton.classList.add("hidden");
      showAnswerButton.classList.add("hidden");
      prompt.innerHTML = "よみこみちゅう...<br><span lang=\"en\">Loading...</span>";

      initFirebase();
      await loadRemoteVerbs();
      populateFilters();
      renderVerbList();

      updateStats();
      startSession();
    }

    boot();
