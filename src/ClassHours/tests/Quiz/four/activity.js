/*
Copyright (C) 2018 Alkis Georgopoulos <alkisg@gmail.com>.
SPDX-License-Identifier: CC-BY-SA-4.0
*/
var act = null;  // activity object, see initActivity()

function onError(message, source, lineno, colno, error) {
  alert(sformat('Σφάλμα προγραμματιστή!\n'
    + 'message: {}\nsource: {}\nlineno: {}\ncolno: {}\nerror: {}',
  message, source, lineno, colno, error));
}

// ES6 string templates don't work in old Android WebView
function sformat(format) {
  var args = arguments;
  var i = 0;
  return format.replace(/{(\d*)}/g, function sformatReplace(match, number) {
    i += 1;
    if (typeof args[number] !== 'undefined') {
      return args[number];
    }
    if (typeof args[i] !== 'undefined') {
      return args[i];
    }
    return match;
  });
}

// Return an integer from 0 to num-1.
function random(num) {
  return Math.floor(Math.random() * num);
}

// Return a shuffled copy of an array.
function shuffle(a) {
  var result = a;
  var i;
  var j;
  var temp;

  for (i = 0; i < result.length; i += 1) {
    j = random(result.length);
    temp = result[i];
    result[i] = result[j];
    result[j] = temp;
  }
  return result;
}

// If word="ΓΑΤΑ" and tilesNum=10, return e.g. "ιδσΑωΓθΤρπ".toUpperCase(),
// i.e. all the 3 characters from word, and 7 additional random chars.
function generateStock(word, tilesNum) {
  var i;
  var result;  // Those are arrays, not strings
  var inword;
  var outword;

  // Verify that all the characters of "word" exit in alphabet
  for (i = 0; i < word.length; i += 1) {
    if (act.alphabet.indexOf(word.charAt(i)) < 0) {
      alert(sformat('Internal error: "{}" contains characters not in alphabet!', word));
      return null;
    }
  }
  // Shuffle the alphabet so that afterwards the outword chars are shuffled
  result = shuffle(act.alphabet.split(''));
  // Split the shuffled alphabet into two arrays, inword and outword
  inword = [];
  outword = [];
  for (i = 0; i < result.length; i += 1) {
    if (word.indexOf(result[i]) >= 0) {
      inword.push(result[i]);
    } else {
      outword.push(result[i]);
    }
  }
  // Merge all of inword and some of outword
  result = inword.concat(outword.slice(0, tilesNum - inword.length));
  // Finally, reshuffle
  result = shuffle(result);
  // Return it as a string
  return result.join('');
}

function ge(element) {
  return document.getElementById(element);
}

function setKeyframes(element, rule, duration) {
  var e = element;
  var i;
  var name = sformat('{}_animation', e.id);

  // The webkit* stuff is for old android webview versions
  e.style.animationName = '';
  e.style.webkitAnimationName = '';
  // First, delete the old animation for this element, if it exists
  for (i = 0; i < act.sheet.cssRules.length; i += 1) {
    if (act.sheet.cssRules[i].name === name) {
      act.sheet.deleteRule(i);
    }
  }
  // Now add the rule
  try {
    act.sheet.insertRule(sformat('@keyframes {} { {} }', name, rule), act.sheet.cssRules.length);
  } catch (err) {
    act.sheet.insertRule(sformat('@-webkit-keyframes {} { {} }', name, rule), act.sheet.cssRules.length);
  }
  void e.offsetWidth;  // https://css-tricks.com/restart-css-animation/
  // IE needs animationDuration before animationName
  e.style.animationDuration = duration || '2s';
  e.style.webkitAnimationDuration = e.style.animationDuration;
  e.style.animationName = name;
  e.style.webkitAnimationName = e.style.animationName;
}

function onResize(event) {
  var w = window.innerWidth;
  var h = window.innerHeight;
  if (w / h < 640 / 360) {
    document.body.style.fontSize = sformat('{}px', 10 * w / 640);
  } else {
    document.body.style.fontSize = sformat('{}px', 10 * h / 360);
  }
}

function doPreventDefault(event) {
  event.preventDefault();
}

function onHome(event) {
  window.history.back();
}

function onHelp(event) {
  ge('help').style.display = 'flex';
  ge('helpaudio').play();
}

function onHelpHide(event) {
  ge('help').style.display = '';
}

function onAbout(event) {
  window.open('credits/index_DS_II.html');
}

function onFullScreen(event) {
  var doc = window.document;
  var docEl = doc.documentElement;
  var requestFullScreen = docEl.requestFullscreen || docEl.mozRequestFullScreen
    || docEl.webkitRequestFullScreen || docEl.msRequestFullscreen;
  var cancelFullScreen = doc.exitFullscreen || doc.mozCancelFullScreen
    || doc.webkitExitFullscreen || doc.msExitFullscreen;

  if (!doc.fullscreenElement && !doc.mozFullScreenElement
    && !doc.webkitFullscreenElement && !doc.msFullscreenElement) {
    requestFullScreen.call(docEl);
  } else {
    cancelFullScreen.call(doc);
  }
}

function onPrevious(event) {
  initLevel(act.level - 1);
}

function onNext(event) {
  initLevel(act.level + 1);
}

// HTML5 drag and drop has various issues (e.g. drag image sizing)
// and not wide browser compatibility. So implement our own way.
// Also, make it work with touch events.
function onDown(obj, x, y) {
  act.dragobj = obj;
  ge('dragimg').style.display = 'block';
  ge('dragimg').src = act.dragobj.src;
  onMove(x, y);
}

function onMove(x, y) {
  var dri;

  if (!act.dragobj) {
    return;
  }
  dri = ge('dragimg');
  dri.style.left = sformat('{}px', x - Math.round(dri.clientWidth / 2));
  dri.style.top = sformat('{}px', y - Math.round(dri.clientHeight / 2));
}

function onUp(x, y) {
  var el;
  var dro;

  if (!act.dragobj) {
    return;
  }
  ge('dragimg').style.display = '';
  dro = act.dragobj;
  act.dragobj = null;
  el = document.elementFromPoint(x, y);
  if (!el || (el.parentElement.id !== 'decrypted')) {
    return;
  }
  el.$ord = dro.$ord;
  el.src = dro.src;
  checkLevelOver();
}

function onStockMouseDown(event) {
  onDown(this, event.pageX, event.pageY);
}

function onDocumentMouseMove(event) {
  onMove(event.pageX, event.pageY);
}

function onDocumentMouseUp(event) {
  onUp(event.pageX, event.pageY);
}

function onStockTouchStart(event) {
  onDown(this, event.touches[0].clientX, event.touches[0].clientY);
  act.mouseX = event.touches[0].clientX;
  act.mouseY = event.touches[0].clientY;
  if (act.dragobj) {
    event.preventDefault();
  }
}

function onTouchMove(event) {
  onMove(event.touches[0].clientX, event.touches[0].clientY);
  act.mouseX = event.touches[0].clientX;
  act.mouseY = event.touches[0].clientY;
  if (act.dragobj) {
    event.preventDefault();
  }
}

function onTouchEnd(event) {
  if (act.dragobj) {
    event.preventDefault();
  }
  onUp(act.mouseX, act.mouseY);
}

function checkLevelOver() {
  var i;

  for (i = 0; i < act.word.length; i += 1) {
    if (act.decrypted[i].$ord !== act.encrypted[i].$ord) {
      return;
    }
  }
  for (i = 0; i < act.word.length; i += 1) {
    setKeyframes(ge(sformat('e{}', i)), [
      sformat('from { transform: rotate({}deg); }', 360 * (2 * (i % 2) - 1)),
      'to { transform: rotate(0deg); }'].join('\n'), '3s');
    setKeyframes(ge(sformat('d{}', i)), [
      sformat('from { transform: rotate({}deg); }', -360 * (2 * (i % 2) - 1)),
      'to { transform: rotate(0deg); }'].join('\n'), '3s');
  }
  setKeyframes(ge('stock'), [
    'from { opacity: 1; }',
    'to { opacity: 0; }'].join('\n'), '4s');
  setTimeout(initLevel, 4000, act.level + 1);
}

function initLevel(newLevel) {
  // Internal level number is zero-based; but we display it as 1-based.
  // We allow/fix newLevel if it's outside its proper range.
  var numLevels = 10;
  var i;
  var words;
  var categoryWords;

  act.level = (newLevel + numLevels) % numLevels;
  // lvl = 0..1: 4 letter words
  // lvl = 2..3: 5 letter words
  // lvl = 4..5: 6 letter words
  // lvl = 6..7: 7 letter words
  // lvl = 8..9: 8 letter words
  // Starting point, in tuxtype:
  // for w in $(awk 'length($0) == 4' animals.txt colors.txt fruit.txt
  //   plants.txt trees.txt | sort -u); do echo -n "'$w', "; done
  words = [
    ['ΑΡΝΙ', 'ΒΟΔΙ', 'ΒΟΔΙ', 'ΓΑΤΑ', 'ΓΚΡΙ', 'ΕΛΙΑ', 'ΚΑΦΕ', 'ΜΗΛΟ', 'ΜΠΛΕ',
      'ΜΥΓΑ', 'ΡΟΔΙ', 'ΡΥΖΙ', 'ΣΥΚΟ', 'ΦΙΔΙ', 'ΧΕΛΙ', 'ΧΗΝΑ', 'ΨΑΡΙ'],
    ['ΑΕΤΟΣ', 'ΑΛΟΓΟ', 'ΑΣΒΟΣ', 'ΑΣΗΜΙ', 'ΑΣΠΡΟ', 'ΔΑΦΝΗ', 'ΕΛΑΤΟ', 'ΕΛΑΦΙ',
      'ΕΛΑΦΙ', 'ΖΕΒΡΑ', 'ΚΟΑΛΑ', 'ΛΑΓΟΣ', 'ΛΥΚΟΣ', 'ΛΩΤΟΣ', 'ΜΑΥΡΟ', 'ΜΟΥΡΟ',
      'ΠΑΝΤΑ', 'ΠΑΠΙΑ', 'ΠΕΥΚΟ', 'ΥΑΙΝΑ', 'ΦΙΚΟΣ', 'ΦΩΚΙΑ', 'ΧΡΥΣΟ'],
    ['ΑΖΑΛΕΑ', 'ΑΚΑΚΙΑ', 'ΑΛΕΠΟΥ', 'ΑΝΑΝΑΣ', 'ΑΡΑΧΝΗ', 'ΑΧΙΝΟΣ', 'ΑΧΛΑΔΙ',
      'ΒΟΥΡΛΑ', 'ΓΑΖΕΛΑ', 'ΓΕΡΑΚΙ', 'ΓΕΡΑΝΙ', 'ΓΛΑΡΟΣ', 'ΔΕΝΔΡΟ', 'ΚΑΜΗΛΑ',
      'ΚΑΡΥΔΑ', 'ΚΕΔΡΟΣ', 'ΚΕΡΑΣΙ', 'ΚΟΜΠΡΑ', 'ΚΟΡΑΚΙ', 'ΚΡΙΑΡΙ', 'ΚΡΙΝΟΣ',
      'ΚΡΙΝΟΣ', 'ΚΡΟΚΟΣ', 'ΚΥΔΩΝΙ', 'ΚΥΚΝΟΣ', 'ΛΕΜΟΝΙ', 'ΛΟΥΙΖΑ', 'ΛΥΓΚΑΣ',
      'ΜΑΝΓΚΟ', 'ΜΟΛΟΧΑ', 'ΜΟΥΡΙΑ', 'ΝΤΑΛΙΑ', 'ΠΑΓΩΝΙ', 'ΠΑΝΣΕΣ', 'ΠΑΤΑΤΑ',
      'ΠΕΠΟΝΙ', 'ΡΙΓΑΝΗ', 'ΣΚΝΙΠΑ', 'ΣΚΥΛΟΣ', 'ΣΠΙΝΟΣ', 'ΣΦΗΓΚΑ', 'ΤΑΥΡΟΣ',
      'ΤΙΓΡΗΣ', 'ΧΕΛΩΝΑ'],
    ['ΑΓΕΛΑΔΑ', 'ΑΜΠΕΛΙΑ', 'ΑΡΚΟΥΔΑ', 'ΑΣΤΑΚΟΣ', 'ΑΧΛΑΔΙΑ', 'ΒΙΟΛΕΤΑ',
      'ΒΙΣΩΝΑΣ', 'ΒΥΣΣΙΝΟ', 'ΓΕΡΑΝΟΣ', 'ΓΙΑΣΕΜΙ', 'ΓΟΡΙΛΑΣ', 'ΔΕΛΦΙΝΙ',
      'ΚΑΒΟΥΡΙ', 'ΚΑΜΕΛΙΑ', 'ΚΑΡΥΔΙΑ', 'ΚΑΣΤΑΝΟ', 'ΚΑΤΣΙΚΑ', 'ΚΕΡΑΣΙΑ',
      'ΚΙΤΡΙΝΟ', 'ΚΟΚΚΙΝΟ', 'ΚΟΡΑΚΑΣ', 'ΚΟΥΝΑΒΙ', 'ΚΟΥΝΕΛΙ', 'ΛΕΒΑΝΤΑ',
      'ΛΟΥΛΑΚΙ', 'ΜΑΝΟΛΙΑ', 'ΜΕΔΟΥΣΑ', 'ΜΕΛΙΣΣΑ', 'ΜΕΝΕΞΕΣ', 'ΜΠΑΝΑΝΑ',
      'ΝΤΟΜΑΤΑ', 'ΟΡΧΙΔΕΑ', 'ΠΑΙΩΝΙΑ', 'ΠΕΡΔΙΚΑ', 'ΠΙΘΗΚΟΣ', 'ΠΟΝΤΙΚΙ',
      'ΠΟΡΦΥΡΑ', 'ΠΡΑΣΙΝΟ', 'ΠΡΟΒΑΤΟ', 'ΣΤΑΦΥΛΙ', 'ΣΤΡΕΙΔΙ', 'ΤΣΑΚΑΛΙ',
      'ΦΑΛΑΙΝΑ', 'ΦΑΣΟΛΙΑ', 'ΦΡΑΟΥΛΑ'],
    ['ΑΝΘΡΩΠΟΣ', 'ΑΝΤΙΛΟΠΗ', 'ΑΣΤΕΡΙΑΣ', 'ΒΑΤΡΑΧΟΣ', 'ΒΕΡΙΚΟΚΟ', 'ΒΟΥΒΑΛΟΣ',
      'ΓΑΙΔΟΥΡΙ', 'ΓΑΡΔΕΝΙΑ', 'ΓΟΥΡΟΥΝΙ', 'ΕΝΥΔΡΙΔΑ', 'ΚΑΡΠΟΥΖΙ', 'ΚΑΣΤΟΡΑΣ',
      'ΚΟΥΝΟΥΠΙ', 'ΚΟΥΡΟΥΝΑ', 'ΛΙΟΝΤΑΡΙ', 'ΜΠΑΝΑΝΙΑ', 'ΜΥΡΜΗΓΚΙ', 'ΜΥΡΤΙΛΟΣ',
      'ΠΕΤΟΥΝΙΑ', 'ΠΛΑΤΑΝΟΣ', 'ΠΟΝΤΙΚΟΣ', 'ΡΟΔΑΚΙΝΟ', 'ΣΚΙΟΥΡΟΣ', 'ΣΠΑΡΑΓΓΙ',
      'ΣΦΕΝΔΑΜΙ', 'ΦΟΙΝΙΚΑΣ', 'ΧΕΛΙΔΟΝΙ'],
    ['ΑΚΤΙΝΙΔΙΟ', 'ΑΣΦΟΔΕΛΟΣ', 'ΒΑΣΙΛΙΚΟΣ', 'ΒΑΤΟΜΟΥΡΟ', 'ΒΕΛΑΝΙΔΙΑ',
      'ΓΑΛΟΠΟΥΛΑ', 'ΔΑΜΑΣΚΗΝΟ', 'ΕΛΕΦΑΝΤΑΣ', 'ΙΑΓΟΥΑΡΟΣ', 'ΚΑΝΓΚΟΥΡΩ',
      'ΚΑΡΧΑΡΙΑΣ', 'ΚΑΤΣΑΡΙΔΑ', 'ΚΟΛΟΚΥΘΙΑ', 'ΚΟΤΟΠΟΥΛΟ', 'ΚΟΥΜΚΟΥΑΤ',
      'ΚΥΚΛΑΜΙΝΟ', 'ΚΥΠΑΡΙΣΣΙ', 'ΜΑΙΝΤΑΝΟΣ', 'ΜΑΝΤΑΡΙΝΙ', 'ΜΑΡΓΑΡΙΤΑ',
      'ΜΠΙΓΚΟΝΙΑ', 'ΝΕΚΤΑΡΙΝΙ', 'ΝΥΧΤΕΡΙΔΑ', 'ΠΑΠΑΓΑΛΟΣ', 'ΠΕΛΕΚΑΝΟΣ',
      'ΠΕΡΙΣΤΕΡΑ', 'ΠΕΡΙΣΤΕΡΙ', 'ΠΕΤΑΛΟΥΔΑ', 'ΠΟΡΤΟΚΑΛΙ', 'ΡΙΝΟΚΕΡΟΣ',
      'ΣΑΛΙΓΚΑΡΙ', 'ΣΚΥΛΟΨΑΡΟ', 'ΣΠΟΥΡΓΙΤΙ', 'ΦΛΑΜΙΝΓΚΟ', 'ΦΛΑΜΟΥΡΙΑ'],
    ['ΑΛΙΓΑΤΟΡΑΣ', 'ΑΡΑΒΟΣΙΤΟΣ', 'ΓΑΡΥΦΑΛΛΙΑ', 'ΓΑΤΟΠΑΡΔΟΣ', 'ΓΛΑΡΟΠΟΥΛΙ',
      'ΙΠΠΟΚΑΜΠΟΣ', 'ΚΟΡΜΟΡΑΝΟΣ', 'ΛΕΟΠΑΡΔΑΛΗ', 'ΠΑΣΧΑΛΙΤΣΑ', 'ΠΙΓΚΟΥΙΝΟΣ'],
  ];

  categoryWords = words[Math.floor(act.level / 2)];
  act.word = categoryWords[random(categoryWords.length)];
  act.sstock = generateStock(act.word, 10);
  console.log(act.word, act.sstock);

  for (i = 0; i < 8; i += 1) {
    if (i < act.word.length) {
      act.encrypted[i].$ord = act.alphabet.indexOf(act.word.charAt(i));
      act.encrypted[i].src = sformat('resource/p{}.png', act.encrypted[i].$ord);
      act.encrypted[i].style.display = '';
      act.decrypted[i].$ord = -1;
      act.decrypted[i].src = 'resource/l.svg';
      act.decrypted[i].style.display = '';
    } else {
      act.encrypted[i].style.display = 'none';
      act.decrypted[i].style.display = 'none';
    }
  }
  for (i = 0; i < 10; i += 1) {
    act.stock[i].$ord = act.alphabet.indexOf(act.sstock.charAt(i));
    act.stock[i].src = sformat('resource/l{}.svg', act.stock[i].$ord);
  }
  ge('level').innerHTML = act.level + 1;
}

function initActivity() {
  var i;

  act = {
    level: 0,
    giftsNum: -1,
    encrypted: [],
    decrypted: [],
    stock: [],
    alphabet: 'ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩ',
    sheet: null,
    dragobj: null,
    mouseX: 0,  // The ontouchend event doesn't contain any coords,
    mouseY: 0,  // so we keep the last ontouchmove ones.
  };
  for (i = 0; i < 8; i += 1) {
    act.encrypted.push(ge(sformat('e{}', i)));
    act.decrypted.push(ge(sformat('d{}', i)));
  }
  for (i = 0; i < 10; i += 1) {
    act.stock.push(ge(sformat('s{}', i)));
    act.stock[i].onmousedown = onStockMouseDown;
    act.stock[i].ontouchstart = onStockTouchStart;
  }
  onResize();
  // Create a <style> element for animations, to avoid CORS issues on Chrome
  act.sheet = document.styleSheets[0];
  // TODO: dynamically? document.head.appendChild(document.createElement('style'));
  // Install event handlers
  document.body.onresize = onResize;
  document.body.oncontextmenu = doPreventDefault;
  document.body.onmousemove = onDocumentMouseMove;
  document.body.onmouseup = onDocumentMouseUp;
  document.body.onmouseleave = onDocumentMouseUp;
  document.body.ontouchmove = onTouchMove;
  document.body.ontouchend = onTouchEnd;
  ge('bar_home').onclick = onHome;
  ge('bar_help').onclick = onHelp;
  ge('help').onclick = onHelpHide;
  ge('bar_about').onclick = onAbout;
  ge('bar_fullscreen').onclick = onFullScreen;
  ge('bar_previous').onclick = onPrevious;
  ge('bar_next').onclick = onNext;
  for (i = 0; i < document.images.length; i += 1) {
    document.images[i].ondragstart = doPreventDefault;
  }
  initLevel(act.level);
}

window.onerror = onError;
window.onload = initActivity;
// Call onResize even before the images are loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', onResize);
} else {  // `DOMContentLoaded` already fired
  onResize();
}
