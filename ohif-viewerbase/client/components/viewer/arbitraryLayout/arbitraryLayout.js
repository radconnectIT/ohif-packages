import { Template } from 'meteor/templating';

Template.arbitraryLayout.helpers({
  height(index) {
    return this.viewportDimensions[index] && this.viewportDimensions[index].height || (100 / this.rows);
  },
  width(index) {
    return this.viewportDimensions[index] && this.viewportDimensions[index].width || (100 / this.columns);
  },
  getElementData(index) {
    return this.elementData && this.elementData.length ? this.elementData[index] : undefined;
  }
});
