
import React from 'react'
import Taro from '@tarojs/taro'
import { View, Image, Button, Input, Picker } from '@tarojs/components';
import style from './index.scss'

interface propsType {
  className: string; // 最外层样式
  placeholder: string; // 没有传id或者传入id找不到对应label时候显示
  name: string; // form表单获取时的字段名
  disabled: boolean;
  placeholderClass: string;
  mode: 'selector' | 'time' | 'date';
  
  range?: Array<any>; // 选项列表
  value?: string | number; // 当前选中的id 可以不传
  rangeKey?: string; // 选项中key对应字段 可以不传 默认用key
  rangeLabel?: string; // 选项中label对应字段 可以不传 默认用label
  onchange?: Function;
}

interface stateType {
  key: string | number;
  label: string;
  index: number;
}

export default  class picker extends React.Component<propsType, stateType> {
  constructor(props) {
    super(props)
    this.state = {
      key: '',
      label: '',
      index: 0,
    };
  }

  UNSAFE_componentWillMount () { 
    if (this.props.value === undefined) return

    if (this.props.mode !== 'selector') {
      this.setState({
        key: this.props.value,
        label: this.props.value + '',
      })
      return
    }

    const option = this.props.range!.find((item, index) => {
      if (item[this.props.rangeKey|| 'key'] === this.props.value) {
        this.setState({
          index: index,
        })
        return true
      }
      return false
    })
    
    if (!option) return
    this.setState({
      key: this.props.value,
      label:option[this.props.rangeLabel|| 'label'],
    })

  }

  componentWillReceiveProps (nextProps) { 
    if (nextProps.value === undefined) return

    if (nextProps.mode !== 'selector') {
      this.setState({
        key: nextProps.value,
        label: nextProps.value + '',
      })
      return
    }

    const option = nextProps.range!.find((item, index) => {
      if (item[nextProps.rangeKey|| 'key'] == nextProps.value) {
        this.setState({
          index: index,
        })
        return true
      }
      return false
    })
    
    if (!option) {
      this.setState({
        key: '',
        label: '',
      })
      return
    }
    this.setState({
      key: nextProps.value,
      label:option[nextProps.rangeLabel|| 'label'],
    })

  }

  onChange = (e) => {
    if (this.props.mode !== 'selector') {
      this.setState({
        key: e.detail.value,
        label: e.detail.value,
      })
      this.props.onchange && this.props.onchange(this.state.key)
      return
    }
    const label = this.props.range![e.detail.value][this.props.rangeLabel|| 'label']
    const key = this.props.range![e.detail.value][this.props.rangeKey|| 'key']

    this.setState({
      label: label,
      key: key,
      index: e.detail.value
    })

    this.props.onchange && this.props.onchange(this.state.key)

  }

  render() {
    return (
      <Picker 
        mode={this.props.mode}
        range={this.props.range}
        className={this.props.className}
        rangeKey={this.props.mode === 'selector' ? this.props.rangeLabel || 'label' : undefined}
        disabled={this.props.disabled}
        value={this.props.mode === 'selector' ?this.state.index : this.state.key}
        onChange={this.onChange}
      >
        {/* 给form 传递id 的input */}
        <Input style={{display: 'none'}} disabled name={this.props.name} value={this.state.key + ''} />

        {/* 展示的input */}
        <Input
          disabled
          className={style.input}
          placeholderClass={this.props.placeholderClass}
          placeholder={this.props.placeholder || ''}
          adjustPosition
          value={this.state.label}
        />
      </Picker>
    )
  }

}