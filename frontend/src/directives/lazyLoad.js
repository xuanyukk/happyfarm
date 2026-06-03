// 文件名：lazyLoad.js
// 作者：开发者
// 日期：2026-03-19
// 版本：v1.0.0
// 功能描述：图片懒加载指令，使用IntersectionObserver API

const lazyLoad = {
  mounted(el) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target;
            const src = img.dataset.src;
            if (src) {
              img.src = src;
              img.classList.add('loaded');
              observer.unobserve(img);
            }
          }
        });
      },
      {
        rootMargin: '50px 0px',
        threshold: 0.01,
      }
    );

    el._lazyObserver = observer;
    observer.observe(el);
  },

  unmounted(el) {
    if (el._lazyObserver) {
      el._lazyObserver.unobserve(el);
    }
  },
};

export default lazyLoad;
