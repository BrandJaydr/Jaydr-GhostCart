const listItems = document.querySelectorAll('.fadeIn');
const productBoxes = document.querySelectorAll('.product-box');

listItems.forEach(function(listItem, index) {
  listItem.setAttribute('style', `animation-delay: ${index * .2}s`);
});

productBoxes.forEach(function(productBox, index) {
  productBox.setAttribute('style', `animation-delay: ${index * .1}s`);
});

document.querySelector('.action-button').addEventListener('click', function () {
    document.querySelector('.app-right').classList.add('isOpen');
  document.querySelector('.app-left').classList.add('hide');
});

document.querySelector('.app-right-hide').addEventListener('click', function () {
    document.querySelector('.app-right').classList.remove('isOpen');
  document.querySelector('.app-left').classList.remove('hide');
});