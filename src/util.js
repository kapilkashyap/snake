export const checkPortableMode = () => {
  if (/Android|webOS|iPhone|iPad|iPod|Opera Mini/i.test(navigator.userAgent)) {
    if (/iPad/i.test(navigator.userAgent)) {
      document.body.style.zoom = '175%';
    } else {
      document.body.style.zoom = '200%';
    }
    document.body.classList.add('portable-device');
    return true;
  }
  return false;
};

export const disableDefaultBehavior = () => {
  // Avoid Ctrl + wheel scroll to zoom-in or zoom-out
  document.body.addEventListener('wheel', function (event) {
    event.preventDefault();
  }, { passive: false });

  // Avoiding double-tap zooming on mobile devices
  // Inspired by https://gist.github.com/ethanny2/44d5ad69970596e96e0b48139b89154b
  document.body.addEventListener('touchend', (function() {
    let lastTap = 0;
    return function(event) {
      const curTime = new Date().getTime();
      const tapLen = curTime - lastTap;
      if (tapLen < 500 && tapLen > 0) {
        event.preventDefault();
      }
      lastTap = curTime;
    };
  })());
};
