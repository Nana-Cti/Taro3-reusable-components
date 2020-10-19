import React from 'react'
import Taro from '@tarojs/taro'
import { View, Canvas, Image, Button } from '@tarojs/components'
import style from './index.scss'


interface PropType {
  imgSrc: string;
  cutRatio: number | null;
  destWidth: number | null;
  imgHeight: number | null;
  imgWidth: number | null;
  imgLeft: number | null;
  imgTop: number | null;
  getImg: Function;
  onCancel: Function;
}

interface StateType {
  imgSrc: string;
  cutRatio: number;
  _imgHeight: number;
  _imgWidth: number;
  _imgRatio: number;
  _imgLeft: number;
  _imgTop: number;
  _windowHeight: number;
  _windowWidth: number;
  _canvasWidth: number;
  _canvasHeight: number;
  _canvasLeft: number;
  _canvasTop: number;
  _cutWidth: number;
  _cutHeight: number;
  _cutLeft: number;
  _cutTop: number;
  scale: number;
  angle: number;
  quality: number;
  maxScale: number;
  minScale: number;
}

function throttle(fn, threshold = 1000 / 40, context = null) {
  let _lastExecTime: null | number = null;
  return function (...args) {
    const _nowTime = new Date().getTime();
    if (_nowTime - Number(_lastExecTime) > threshold || !_lastExecTime) {
      fn.apply(context, args);
      _lastExecTime = _nowTime;
    }
  };
}
export default class ImageCropper extends React.Component<PropType, StateType> {
  static defaultProps = {
    imgSrc: '', //图片路径
    cutRatio: 1, //裁剪框的 宽/高 比
    destWidth: null, //要导出的图片的宽度
    imgHeight: null, //图片的高度
    imgWidth: null, //图片的宽度
    imgLeft: 0, //图片相对可使用窗口的左边距
    imgTop: 0, //图片相对可使用窗口的上边距
  };

  constructor(props) {
    super(props);
    this.state = {
      imgSrc: props.imgSrc,
      cutRatio: Number(props.cutRatio), //裁剪框的 宽/高 比
      _imgHeight: 0, //图片的高度
      _imgWidth: 0, //图片的宽度
      _imgRatio: 1, //图片的 宽/高 比
      _imgLeft: 0, //图片相对可使用窗口的左边距
      _imgTop: 0, //图片相对可使用窗口的上边距
      _windowHeight: 0, //可使用窗口的高
      _windowWidth: 0, //可使用窗口宽度
      _canvasWidth: 0, //canvas的宽度
      _canvasHeight: 0, //canvas的高度
      _canvasLeft: 0, //canvas相对可使用窗口的左边距
      _canvasTop: 0, //canvas相对可使用窗口的上边距
      _cutWidth: 200, //裁剪框的宽度
      _cutHeight: 200, //裁剪框的高度
      _cutLeft: 0, //裁剪框相对可使用窗口的左边距
      _cutTop: 0, //裁剪框相对可使用窗口的上边距
      scale: Number(props.scale) || 1, //默认图片的放大倍数
      angle: Number(props.angle) || 0, //图片旋转角度
      quality: 0.3, //图片的质量
      maxScale: 4,
      minScale: 1,// 设置为1, 则不能比框小
    };
    // const { platform } = Taro.getSystemInfoSync();
    // // 安卓节流
    // if (platform === 'android') {
    this._imgTouchMove = throttle(this._imgTouchMove, 1000 / 40, this);
    // }
  }
  async componentWillMount() {
    this.initCanvas();
    await this.getDeviceInfo();
    await this.computedCutSize();
    await this.computedCutDistance();
    await this.initImageInfo();
    await this.computedImageSize();
    await this.computedImageDistance();
  }

 
  //触摸事件的相对位置
  _imgTouchRelative = [
    {
      x: 0,
      y: 0,
    },
    {
      x: 0,
      y: 0,
    },
  ];

  // 斜边长
  _hypotenuseLength = 0;

  ctx: Taro.CanvasContext
  /**
   *  获取canvas上下文
   */
  initCanvas() {
    this.ctx = Taro.createCanvasContext('my-canvas', this.$scope);
  }
  /**
   * 获取设备屏幕的宽高
   */
  async getDeviceInfo() {
    const { windowHeight, windowWidth } = await Taro.getSystemInfoSync();
    const { system, statusBarHeight } = Taro.getSystemInfoSync()
    const isIOS = system.indexOf('iOS') > -1
    const navHeight = isIOS ? 0 : (48 + statusBarHeight)
    return new Promise((resolve) => {
      this.setState(
        {
          _windowHeight: windowHeight + navHeight,
          _windowWidth: windowWidth,
        },
        resolve
      );
    });
  }
  /**
   * 初始化图片信息
   */
  async initImageInfo() {
    const { imgSrc } = this.state;
    const { width, height, path } = await Taro.getImageInfo({
      src: imgSrc,
    });
    return new Promise((resolve) => {
      this.setState(
        {
          imgSrc: path,
          // _imgHeight: height,
          // _imgWidth: width,
          _imgRatio: width / height,
        },
        resolve
      );
    });
  }
  /**
   *  计算裁剪框的宽高
   */
  computedCutSize() {
    const { _windowWidth, _windowHeight, cutRatio } = this.state;
    //设裁剪框的框度为可使用窗口宽度的2/3
    let initialCutWidth = Math.floor((_windowWidth * 2) / 3);
    //则裁剪框的高度 = 宽度/_cutRatio
    let initialCutHeight = initialCutWidth / cutRatio;

    // 如果计算后的高度大于等于屏幕高度，则让裁剪框的高度等于可使用窗口的1/2
    if (initialCutHeight >= _windowHeight) {
      initialCutHeight = Math.floor(_windowHeight / 2);
      initialCutWidth = initialCutHeight * cutRatio;
    }
    return new Promise((resolve) => {
      this.setState(
        {
          _cutHeight: initialCutHeight,
          _cutWidth: initialCutWidth,
        },
        resolve
      );
    });
  }
  /**
   *  计算裁剪框距离可使用窗口的距离
   */
  computedCutDistance() {
    const {
      _windowHeight,
      _windowWidth,
      _cutHeight,
      _cutWidth,
    } = this.state;
    const _cutTop = (_windowHeight - _cutHeight) / 2; //因为裁剪框居中，所以可直接对半分
    const _cutLeft = (_windowWidth - _cutWidth) / 2;
    return new Promise((resolve) => {
      this.setState(
        {
          _cutTop,
          _cutLeft,
        },
        resolve
      );
    });
  }
  /**
   * 计算图片的宽高信息
   * 让图片的短边铺满裁剪框
   */
  computedImageSize() {
    const { _imgRatio, _cutHeight, _cutWidth } = this.state;
    let _imgWidth, _imgHeight;
    // 高比较长
    if (_imgRatio <= 1) {
      _imgWidth = _cutWidth;
      _imgHeight = _imgWidth / _imgRatio;
    } else {
      // 宽比较长
      _imgHeight = _cutHeight;
      _imgWidth = _imgHeight * _imgRatio;
    }
    return new Promise((resovle) => {
      this.setState(
        {
          _imgHeight: Number(this.props.imgHeight) || _imgHeight,
          _imgWidth: Number(this.props.imgWidth) || _imgWidth,
        },
        resovle
      );
    });
  }

  /**
   * 计算图片相对可使用窗口的距离
   */
  computedImageDistance() {
    const {
      _imgWidth,
      _imgHeight,
      _windowHeight,
      _windowWidth,
    } = this.state;
    const _imgLeft = (_windowWidth - _imgWidth) / 2;
    const _imgTop = (_windowHeight - _imgHeight) / 2;
    return new Promise((resolve) => {
      this.setState(
        {
          _imgLeft: Number(this.props.imgLeft) || _imgLeft,
          _imgTop: Number(this.props.imgTop) || _imgTop,
        },
        resolve
      );
    });
  }

  /**
   *  图片的点击，移动，移动结束事件
   */
  _imgTouchStart(e) {
    this._touchEndFlag = false; //开始触摸
    if (e.touches.length === 1) {
      // 是否单指触摸
      this._touchPointerOne = true;
      // 单指触摸
      // 记录下开始时的触摸点的位置
      this._imgTouchRelative[0] = {
        //减去图片相对视口的位置，得到手指相对图片的左上角的位置x,y
        x: e.touches[0].clientX - this.state._imgLeft,
        y: e.touches[0].clientY - this.state._imgTop,
      };
    } else {
      this._touchPointerOne = false;
      //双指放大
      const width = Math.abs(e.touches[0].clientX - e.touches[1].clientX);
      const height = Math.abs(e.touches[0].clientY - e.touches[1].clientY);

      this._hypotenuseLength = Math.sqrt(
        Math.pow(width, 2) + Math.pow(height, 2)
      );

      // const imgWidth = this.state.angle % 180 ? this.state._imgHeight : this.state._imgWidth
      // const imgHeight = this.state.angle % 180 ? this.state._imgWidth : this.state._imgHeight
      const imgWidth = this.state._imgWidth
      const imgHeight = this.state._imgHeight

      // 双指旋转
      this._imgTouchRelative = [
        {
          x:
            e.touches[0].clientX -
            this.state._imgLeft -
            imgWidth / 2,
          y:
            e.touches[0].clientY -
            this.state._imgTop - 
            imgHeight / 2,
        },
        {
          x:
            e.touches[1].clientX -
            this.state._imgLeft -
            imgWidth / 2,
          y:
            e.touches[1].clientY -
            this.state._imgTop -
            imgHeight / 2,
        },
      ];
    }
    console.log('开始', this._imgTouchRelative);
  }
  _touchPointerOne

  _imgTouchMove(e) {
    //如果结束触摸，则不再移动
    if (this._touchEndFlag) {
      console.log('结束false');
      return;
    }

    // const imgWidth = this.state.angle % 180 ? this.state._imgHeight : this.state._imgWidth
    // const imgHeight = this.state.angle % 180 ? this.state._imgWidth : this.state._imgHeight
    const imgWidth = this.state._imgWidth
    const imgHeight = this.state._imgHeight

    if (e.touches.length === 1 && this._touchPointerOne) {
      // 单指拖动
      let left = e.touches[0].clientX - this._imgTouchRelative[0].x;
      let top = e.touches[0].clientY - this._imgTouchRelative[0].y;
      const right = left + imgWidth * this.state.scale
      const bottom = top + imgHeight * this.state.scale


      const isLeaveLeft = left >= this.state._cutLeft + (imgWidth * (this.state.scale - 1) / 2)
      const isLeaveTop = top >= this.state._cutTop + (imgHeight * (this.state.scale - 1) / 2)
      const isLeaveRight = this.state._cutLeft + this.state._cutWidth + (imgWidth * (this.state.scale - 1) / 2) >= right
      const isLeaveBottom = this.state._cutTop + this.state._cutHeight + (imgHeight * (this.state.scale - 1) / 2) >= bottom

      isLeaveLeft && (left = this.state._cutLeft + (imgWidth * (this.state.scale - 1) / 2))
      isLeaveTop && (top = this.state._cutTop + (imgHeight * (this.state.scale - 1) / 2))
      isLeaveRight && (left = this.state._cutLeft + this.state._cutWidth - imgWidth * this.state.scale + (imgWidth * (this.state.scale - 1) / 2))
      isLeaveBottom && (top = this.state._cutTop + this.state._cutHeight - imgHeight * this.state.scale + (imgHeight * (this.state.scale - 1) / 2))
      
      // console.log(
      //   isLeaveLeft,
      //   isLeaveTop,
      //   isLeaveRight,
      //   isLeaveBottom,
      // )
      // console.log('图片top',top , '裁切框top',this.state._cutTop)

      setTimeout(() => {
        this.setState({
          _imgLeft: left,
          _imgTop: top
        });
      }, 0);
    } else if (e.touches.length >= 2 && !this._touchPointerOne) {
      //双指放大
      const width = Math.abs(e.touches[0].clientX - e.touches[1].clientX);
      const height = Math.abs(e.touches[0].clientY - e.touches[1].clientY);

      const newHypotenuseLength = Math.sqrt(
        Math.pow(width, 2) + Math.pow(height, 2)
      );
      //放大的倍数，等于现在的倍数*（现在两点的距离/上次两点间的距离）
      let newScale =
        this.state.scale *
        (newHypotenuseLength / this._hypotenuseLength);
      //如果缩放倍数超过maxScale或是minScale，则不变化，

      newScale = this.state.scale > newScale ? 
        newScale < this.state.minScale + 0.1 ? this.state.minScale : newScale
        :
        newScale > this.state.maxScale - 0.1 ? this.state.maxScale : newScale


      this._hypotenuseLength = newHypotenuseLength;


      
      

      // 后面注释的部分是旋转
      const targetLeft = this.state._cutLeft + (imgWidth * (newScale - 1) / 2)
      const targetTop = this.state._cutTop + (imgHeight * (newScale - 1) / 2)

      setTimeout(() => {
        this.setState({
          _imgLeft: 
            this.state.scale > newScale ? 
              targetLeft > this.state._imgLeft ? this.state._imgLeft + 5 : targetLeft
              : 
              this.state._imgLeft,
          _imgTop: 
            this.state.scale > newScale ? 
              targetTop > this.state._imgTop ? this.state._imgTop + 5 : targetTop
              : 
              this.state._imgTop,
          scale: newScale,
        })
      }, 0);
    }
  }
  _touchEndFlag: boolean
  _imgTouchEnd() {
    this._touchEndFlag = true;
  }
  /**
   * 导出图片的本地地址
   */
  _getImg() {
    const { _cutHeight, _cutWidth, cutRatio, quality } = this.state;
    return new Promise((resolve, reject) => {
      this._draw(() => {
        console.log('canvasToTempFilePath')
        Taro.canvasToTempFilePath(
          {
            width: _cutWidth,
            height: _cutHeight,
            destWidth: this.props.destWidth || _cutWidth,
            destHeight: this.props.destWidth
              ? this.props.destWidth / cutRatio
              : _cutHeight,
            canvasId: 'my-canvas',
            fileType: 'png',
            quality: quality,
            success:(res) => {
              console.log(res, '成功');
              resolve(res);
            },
            fail: (err) => {
              console.log(err, 'err');
              setTimeout(() => {
                Taro.canvasToTempFilePath(
                  {
                    width: _cutWidth,
                    height: _cutHeight,
                    destWidth: this.props.destWidth || _cutWidth,
                    destHeight: this.props.destWidth
                      ? this.props.destWidth / cutRatio
                      : _cutHeight,
                    canvasId: 'my-canvas',
                    fileType: 'png',
                    quality: quality,
                    success:(res) => {
                      console.log(res, '成功');
                      resolve(res);
                    },
                    fail: (err) => {
                      console.log(err, 'err');
                      reject(err);
                    },
                  },
                  this.$scope //不这样写会报错
                );
              }, 200);
            },
          },
          this.$scope //不这样写会报错
        );
      });
    });
  }
  /**
   * 绘制图片
   */
  _draw(callback) {
    const {
      _cutHeight,
      _cutWidth,
      _cutLeft,
      _cutTop,
      angle,
      scale,
      _imgWidth,
      _imgHeight,
      _imgLeft,
      _imgTop,
      imgSrc,
    } = this.state;

    this.setState(
      {
        _canvasHeight: _cutHeight,
        _canvasWidth: _cutWidth,
        _canvasLeft: _cutLeft,
        _canvasTop: _cutTop,
      },
      () => {
        // 用户移动旋转放大后的图像大小thu
        const imgWidth = _imgWidth * scale;
        const imgHeight = _imgHeight * scale;
        // 图片和裁剪框的相对距离
        const distX =
          _imgLeft - (_imgWidth * (scale - 1)) / 2 - _cutLeft;
        const distY =
          _imgTop - (_imgHeight * (scale - 1)) / 2 - _cutTop;
        console.log(this.ctx, 'ctx');
        
        // 根据图像的旋转角度，旋转画布的坐标轴,
        //为了旋转中心在图片的中心，需要先移动下画布的坐标轴
        this.ctx.translate(
          distX + imgWidth / 2,
          distY + imgHeight / 2
        );
        this.ctx.rotate((angle * Math.PI) / 180);
        this.ctx.translate(
          -distX - imgWidth / 2,
          -distY - imgHeight / 2
        );
        //根据相对距离移动画布的原点
        this.ctx.translate(distX, distY);

        // 绘制图像
        this.ctx.drawImage(imgSrc, 0, 0, imgWidth, imgHeight);
        this.ctx.draw(false, () => {
          console.log('draw');

          callback && callback();
        });
        
      }
    );
  }

  async isAuthorize(authorize) {
    const authSetting = await Taro.getSetting();
    if (!authSetting[authorize]) {
      return new Promise((resolve, reject) => {
        Taro.authorize({
          scope: 'scope.writePhotosAlbum',
          success() {
            resolve('yes');
          },
          fail() {
            reject();
          },
        });
      });
    }
    return Promise.resolve('yes');
  }

  async handleOk() {
    const isAuthSetting = await this.isAuthorize('scope.writePhotosAlbum');
    if (isAuthSetting === 'yes') {
      const result = await this._getImg();
      console.log('result')
      this.props.getImg && this.props.getImg(result.tempFilePath)
    } else {
      Taro.showToast({
        title: '请在右上角授权',
      });
    }
  }

  rotate = () => {
    this.setState({
      angle: (this.state.angle + 90)%360,

    })
  }

  render() {
    const {
      _cutTop,
      _cutLeft,
      _cutWidth,
      _cutHeight,
      imgSrc,
      _imgHeight,
      _imgWidth,
      _imgLeft,
      _imgTop,
      scale,
      angle,
      _canvasHeight,
      _canvasWidth,
      _canvasLeft,
      _canvasTop,
    } = this.state;
    return (
      <View className={style['image-cropper-wrapper']}>
        <Button
          className={style.cancel}
          size='mini'
          onClick={() => this.props.onCancel()}
        >取消</Button>
        {/* <Image
          src={require('@/images/home/rotate.png').default}
          className={style.rotate}
          onClick={this.rotate}
        /> */}
        <Button
          type='primary'
          className={style.submit}
          size='mini'
          onClick={() => this.handleOk()}
        >确定</Button>
        <View className={style['bg_container']}>
          <View className={style['bg_top']} ></View>
          <View className={style['bg_middle']}>
            <View className={style['bg_middle_left']}></View>
            <View
              className={style['cut_wrapper']}
              style={{
                width: _cutWidth + 'px',
                height: _cutHeight + 'px',
              }}
            >
              <View className={`${style['border']} ${style['border-top-left']}`}></View>
              <View className={`${style['border']} ${style['border-top-right']}`}></View>
              <View className={`${style['border']} ${style['border-right-top']}`}></View>
              <View className={`${style['border']} ${style['border-bottom-right']}`}></View>
              <View className={`${style['border']} ${style['border-right-bottom']}`}></View>
              <View className={`${style['border']} ${style['border-bottom-left']}`}></View>
              <View className={`${style['border']} ${style['border-left-bottom']}`}></View>
              <View className={`${style['border']} ${style['border-left-top']}`}></View>
            </View>
            <View className={style['bg_middle_right']}></View>
          </View>
          <View className={style['bg_bottom']}></View>
        </View>
        <View
          className={style['img']}
          style={{
            width: _imgWidth * scale + 'px',
            height: _imgHeight * scale + 'px',
            top: _imgTop - (_imgHeight * (scale - 1)) / 2 + 'px',
            left: _imgLeft - (_imgWidth * (scale - 1)) / 2 + 'px',
            // translate3d(${_imgLeft}px,${_imgTop}px,0)
            transform: `rotate(${angle}deg) `,
            transformOrigin: `${(_cutLeft + _cutWidth / 2) - (_imgLeft - (_imgWidth * (scale - 1)) / 2)}px ${(_cutTop + _cutHeight / 2) - (_imgTop - (_imgHeight * (scale - 1)) / 2) }px`,
          }}
          onTouchStart={(e) => this._imgTouchStart(e)}
          onTouchMove={(e) => this._imgTouchMove(e)}
          onTouchEnd={() => this._imgTouchEnd()}
        >
          <Image
            className={style['Image']}
            src={imgSrc}
          />
        </View>
        <Canvas
          type=''
          canvasId='my-canvas'
          className={style['my-canvas-class']}
          disableScroll={false}
          style={{
            width: _canvasWidth + 'px',
            height: _canvasHeight + 'px',
            left: _canvasLeft + 'px',
            top: _canvasTop + 'px',
          }}
        ></Canvas>
      </View>
    );
  }
}
