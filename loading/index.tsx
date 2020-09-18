import React, { Component } from 'react';
import { View, Image } from '@tarojs/components';
import Taro from '@tarojs/taro'
import style from './index.scss'

interface PagePros {
    color?: any;
}
class Page extends Component<PagePros> {
    constructor(props){
      super(props)
      this.state = {}
    }
    UNSAFE_componentWillMount () {
      console.log('1212')
    }
    render() {
        return (
            <View className={style['loading-box']} data-color='red'>
                <View style='width:100%;height:100%' className={style['lds-rolling']}>
                    <Image className={style.Image} src={require('@/images/home/loading.svg').default}  />
                    {/* <View className={style.circle} style={{ borderColor: this.props.color }} /> */}
                    {/*<View className='circle-gap'/>*/}
                </View>
            </View>
        )}
}

export default Page;
