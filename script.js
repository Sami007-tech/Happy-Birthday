'use strict';
const $ = id => document.getElementById(id);
let finished = false, attempt = 0;
let stream, audio, frame, micTimer, revealTimer, confettiTimer;

function stopMicrophone() {
  attempt++;
  cancelAnimationFrame(frame);
  clearTimeout(micTimer);
  stream?.getTracks().forEach(track => track.stop());
  if (audio && audio.state !== 'closed') audio.close().catch(() => {});
  stream = audio = null;
}

function confetti() {
  clearTimeout(confettiTimer);
  $('confetti').replaceChildren();
  for (let i = 0; i < 36; i++) {
    const heart = document.createElement('span');
    heart.textContent = '♥';
    heart.style.left = `${Math.random() * 100}%`;
    heart.style.color = ['#be4766', '#e9a6b5', '#b68b40'][i % 3];
    heart.style.animationDelay = `${Math.random() * .7}s`;
    $('confetti').append(heart);
  }
  confettiTimer = setTimeout(() => $('confetti').replaceChildren(), 4500);
}

function blowOut() {
  if (finished) return;
  finished = true;
  stopMicrophone();
  $('cake').classList.add('out');
  $('status').textContent = 'Your wish is on its way. ♡';
  $('mic').hidden = $('tap').hidden = true;
  revealTimer = setTimeout(() => {
    $('intro').hidden = true;
    $('birthday').hidden = false;
    $('birthday').classList.add('reveal');
    window.scrollTo(0, 0);
    $('birthday-title').focus({ preventScroll:true });
    confetti();
  }, 1600);
}

$('tap').addEventListener('click', blowOut);
$('mic').addEventListener('click', async () => {
  if (finished || $('mic').disabled) return;
  if (!navigator.mediaDevices?.getUserMedia) {
    $('status').textContent = 'Microphone unavailable. Use the tap button, or open on localhost or HTTPS.';
    return;
  }
  stopMicrophone();
  const current = attempt;
  $('mic').disabled = true;
  $('status').textContent = 'Allow the microphone, then wait for the listening message.';
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    audio = new AudioContextClass();
    await audio.resume();
    const acquired = await navigator.mediaDevices.getUserMedia({
      audio:{ echoCancellation:false, noiseSuppression:false, autoGainControl:false }
    });
    if (finished || current !== attempt) {
      acquired.getTracks().forEach(track => track.stop());
      return;
    }
    stream = acquired;
    if (audio.state !== 'running') throw new Error('Audio unavailable');
    const analyser = audio.createAnalyser();
    analyser.fftSize = 2048;
    audio.createMediaStreamSource(stream).connect(analyser);
    const samples = new Float32Array(analyser.fftSize);
    const start = performance.now();
    let total = 0, count = 0, strongSince = null, listening = false;
    $('status').textContent = 'One quiet moment…';
    micTimer = setTimeout(() => {
      stopMicrophone();
      $('mic').disabled = false;
      $('status').textContent = 'Try again, or blow them out with a tap.';
    }, 45000);
    function listen(now) {
      if (finished || current !== attempt) return;
      analyser.getFloatTimeDomainData(samples);
      const rms = Math.sqrt(samples.reduce((sum, value) => sum + value * value, 0) / samples.length);
      if (now - start < 800) { total += rms; count++; }
      else {
        if (!listening) {
          listening = true;
          $('status').textContent = 'Now blow gently towards your microphone…';
        }
        const threshold = Math.max(.045, Math.min(.22, total / Math.max(count, 1) * 2.5));
        if (rms > threshold) {
          strongSince ??= now;
          if (now - strongSince > 240) { blowOut(); return; }
        } else strongSince = null;
      }
      frame = requestAnimationFrame(listen);
    }
    frame = requestAnimationFrame(listen);
  } catch {
    if (finished || current !== attempt) return;
    stopMicrophone();
    $('mic').disabled = false;
    $('status').textContent = 'Microphone access wasn’t available. Use the tap button instead.';
  }
});

document.addEventListener('visibilitychange', () => {
  if (!document.hidden) return;
  stopMicrophone();
  $('mic').disabled = false;
  if (!finished) $('status').textContent = 'Ready when you are. Make a wish!';
});
window.addEventListener('pagehide', () => {
  stopMicrophone();
  clearTimeout(confettiTimer);
});

$('open-letter').addEventListener('click', () => $('letter').showModal());
$('close-letter').addEventListener('click', () => $('letter').close());
$('letter').addEventListener('click', event => {
  if (event.target !== $('letter')) return;
  const rect = $('letter').getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) $('letter').close();
});
$('wish').addEventListener('click', () => {
  confetti();
  $('wish-status').textContent = 'May your sweetest wishes come true. ♡';
});

// IndexedDB keeps uploaded photos in this browser, without a backend.
const database = new Promise(resolve => {
  try {
    const request = indexedDB.open('birthday-keepsake', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('photos');
    request.onsuccess = () => resolve(request.result);
    request.onerror = request.onblocked = () => resolve(null);
  } catch { resolve(null); }
});
async function photoStorage(key, file) {
  const db = await database;
  if (!db) throw new Error('Storage unavailable');
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('photos', file ? 'readwrite' : 'readonly');
    const store = transaction.objectStore('photos');
    const request = file ? store.put(file, key) : store.get(key);
    transaction.oncomplete = () => resolve(request.result);
    transaction.onerror = transaction.onabort = () => reject(transaction.error);
  });
}

const captions = [
  'My favorite place is with you', 'A little moment, a lot of love',
  'You + me, always', 'Here’s to a thousand more'
];
captions.forEach((caption, index) => {
  const figure = document.createElement('figure');
  figure.className = 'photo';
  figure.innerHTML = `<button class="photo-button" type="button" disabled>
    <img hidden alt="Our memory ${index + 1}"><span>＋ Add our photo</span>
    </button><input type="file" accept="image/jpeg,image/png,image/webp" hidden>
    <figcaption></figcaption><p class="photo-error" role="status"></p>`;
  figure.querySelector('figcaption').textContent = caption;
  const button = figure.querySelector('button');
  const input = figure.querySelector('input');
  const image = figure.querySelector('img');
  const error = figure.querySelector('.photo-error');
  button.setAttribute('aria-label', `Upload or replace photo ${index + 1}`);
  $(index < 2 ? 'photos-left' : 'photos-right').append(figure);
  let imageUrl;
  function display(file) {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    imageUrl = URL.createObjectURL(file);
    image.src = imageUrl;
    image.hidden = false;
    button.classList.add('has-photo');
    button.querySelector('span').textContent = 'Change photo';
  }
  image.onerror = () => { error.textContent = 'This photo could not display. Please choose another.'; };
  photoStorage(index).then(file => { if (file) display(file); })
    .catch(() => { error.textContent = 'Browser storage unavailable. Photos will be temporary.'; })
    .finally(() => { button.disabled = false; });
  button.addEventListener('click', () => input.click());
  input.addEventListener('change', async () => {
    const file = input.files[0];
    input.value = '';
    if (!file) return;
    if (!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 8 * 1024 * 1024) {
      error.textContent = 'Choose a JPG, PNG, or WebP photo under 8 MB.';
      return;
    }
    button.disabled = true;
    display(file);
    try { await photoStorage(index, file); error.textContent = 'Saved in this browser. ♡'; }
    catch { error.textContent = 'Could not save. This photo is visible only until you close or reload the page.'; }
    finally { button.disabled = false; }
  });
});
