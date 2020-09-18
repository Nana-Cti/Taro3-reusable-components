import React from 'react'
import Taro from '@tarojs/taro'
import { View, Image, Text } from '@tarojs/components';
import style from './index.scss'

interface propsType {
  navigateFn?: (event: any) => void;
  navigateText?: string;
  onBack?: boolean;
}

const {statusBarHeight, system} = Taro.getSystemInfoSync()
const isIOS = system.indexOf('iOS') > -1
const navHeight = isIOS ? 44 : 48 
const height = statusBarHeight + navHeight - 6

export default (props:propsType) => {
  const {navigateFn, onBack} = props
  const currentPages = Taro.getCurrentPages()
  const navigateBack = () => {
    if(currentPages.length === 1) {
      Taro.reLaunch({
        url: '/pages/main/login/index'
      })
      return 
    }
    navigateFn&& navigateFn({})
    navigateFn || Taro.navigateBack()
  }
  return (
    <View className={style.navigate} style={{height: height}}>
      <View 
        style={{height: height, display: onBack ? 'none' : '' }}
        onClick={navigateBack}
        className={style.navigateBack }
      >
        <Image className={style.backImg} src={require(`@/images/home/Path.png`).default} ></Image>
      </View>
      <Text className={style.navigateText}>{props.navigateText}</Text>
    </View>
  )
} 