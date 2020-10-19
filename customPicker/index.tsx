

import React from 'react'
import Taro from '@tarojs/taro'
import { View, Button, Input, PickerView, PickerViewColumn } from '@tarojs/components';
import style from './index.scss'


interface PropsType {
  className: string; // 最外层样式
  placeholder: string; // 没有传id或者传入id找不到对应label时候显示
  name: string; // form表单获取时的字段名
  range: Array<{
    key: string;
    label: string;
  }>; // 选项列表
  disabled: boolean;
  placeholderClass: string;

  value?: string | number; // 当前选中的id 可以不传
  rangeKey?: string; // 选项中key对应字段 可以不传 默认用key
  rangeLabel?: string; // 选项中label对应字段 可以不传 默认用label

  onchange?: Function;
  onScrollToLower?: Function; // 下拉触底时调用可以用作分页加载, 不传不触发
}
interface StateType {
  show: boolean; // 控制遮罩的显示
  label: string; // 当前选中项目的label
  key: string | number; // 当前选中项目的key

  cacheIndex: number; // 当前滑动到的索引
}

export default class CustomPicker extends React.Component<PropsType, StateType> {
  constructor(props) {
    super(props)
    this.state = {
      show: false,
      label: '',
      key: this.props.value === undefined ? '' : this.props.value,

      cacheIndex: 0,
    };
  }

  componentWillReceiveProps (nextProps) {
    if (nextProps.value === undefined) return
    const option = nextProps.range.find(item => item[nextProps.rangeKey || 'key'] == nextProps.value)
    if (!option) {
      this.setState({
        label: '',
        key: '',
      })
      return
    }
    this.setState({ label: option[nextProps.rangeLabel || 'label'] })
  }

  // 显示
  showPickerView = (e) => {
    e.stopPropagation()
    this.setState({ show: true })
  }

  // 隐藏
  hiddenPickerView = (e?) => {
    e && e.stopPropagation()
    this.setState({ show: false })
  }

  // 保存当前滑到的值, 触发触底反馈
  onChange = (e) => {
    this.setState({ cacheIndex: e.detail.value[0] })
    if (e.detail.value[0] > this.props.range.length - 3) {
      this.props.onScrollToLower && this.props.onScrollToLower()
    }
  }

  // 确定选中
  onSubmit = () => {
    if (!this.props.range.length) {
      this.hiddenPickerView()
      return
    }
    const label = this.props.range[this.state.cacheIndex][this.props.rangeLabel || 'label']
    const key = this.props.range[this.state.cacheIndex][this.props.rangeKey || 'key']

    this.setState({
      label: label,
      key: key,
    }, () => {
      this.props.onchange && this.props.onchange(this.props.range[this.state.cacheIndex])
      this.hiddenPickerView()
    })
  }

  render() {
    return (
      <View className={this.props.className}>
        <Input style={{ display: 'none' }} disabled name={this.props.name} value={this.state.key + ''} />
        <Input
          disabled
          onClick={this.props.disabled ? undefined : this.showPickerView}
          className={style.sectionValue}
          placeholderClass={this.props.placeholderClass}
          placeholder={this.props.placeholder || ''}
          value={this.state.label}
        />
        <View
          className={`${style.Mask} ${this.state.show ? undefined : style.hidden}`}
          // 解决滑动穿透
          onClick={(e) => { e.stopPropagation(); this.hiddenPickerView(e) }}
          onTouchMove={(e) => { e.stopPropagation() }}
        >
          <View // 阻止冒泡
            onClick={(e) => { e.stopPropagation() }}
            className={style.PickerViewShell}
          >
            
            <PickerView
              indicatorClass={style.indicatorClass}
              className={style.PickerView}
              maskClass={style.maskClass}
              onChange={this.onChange}
            >
              <PickerViewColumn>
                {this.props.range?.map((option, index) => {
                  return (
                    <View key={index} className={style.option}>
                      {option[this.props.rangeLabel || 'label']}
                    </View>
                  )
                })}
              </PickerViewColumn>
            </PickerView>

            <View className={style.button}>
              <Button
                size='mini'
                plain
                hoverClass='none'
                hoverStopPropagation
                type='default'
                onClick={this.hiddenPickerView}
              >取消</Button>
              <Button
                size='mini'
                plain
                hoverClass='none'
                hoverStopPropagation
                type='primary'
                onClick={this.onSubmit}
              >确定</Button>
            </View>
          </View>

        </View>
      </View>
    )
  }
}

// 使用方法 该模块暂时弃用, 不需要分页的上拉选框了
{/* <CustomPicker 
  disabled={!!this.props.disabled}
  name={this.props.name}
  className={style.sectionValue}
  placeholderClass={`${style.sectionPlaceholder} ${this.props.value === '' && this.props.warn && style.warn}`}
  placeholder={this.props.placeholder || ''}
  rangeKey='rangeKey'
  rangeLabel='name'
  value={this.props.value}
  range={this.state.sex}
/> */}