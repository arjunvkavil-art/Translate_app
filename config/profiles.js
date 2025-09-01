// Industrial Software Profiles Configuration
// This file contains pre-configured profiles for various Chinese industrial software

const INDUSTRIAL_PROFILES = {
  // Inovance IRCB500 - HMI Configuration Software
  'inovance_ircb500': {
    name: 'Inovance IRCB500',
    description: 'Chinese HMI configuration software for servo control systems',
    category: 'HMI',
    ocr_settings: {
      language: 'chi_sim',
      confidence_threshold: 0.6,
      preprocess: ['deskew', 'noise_removal'],
      font_hints: ['simsun', 'simhei', 'microsoft yahei']
    },
    screen_regions: {
      toolbar: { x: 0, y: 0, width: 800, height: 60 },
      menu: { x: 0, y: 60, width: 200, height: 600 },
      main_area: { x: 200, y: 60, width: 600, height: 600 },
      status_bar: { x: 0, y: 660, width: 800, height: 40 }
    },
    custom_terms: {
      // Basic UI elements
      '文件': 'File',
      '编辑': 'Edit',
      '视图': 'View',
      '工具': 'Tools',
      '帮助': 'Help',
      '确定': 'OK',
      '取消': 'Cancel',
      '应用': 'Apply',
      '关闭': 'Close',
      '保存': 'Save',
      '打开': 'Open',
      '新建': 'New',
      
      // Servo control terms
      '伺服': 'Servo',
      '伺服器': 'Servo Drive',
      '伺服电机': 'Servo Motor',
      '伺服参数': 'Servo Parameters',
      '伺服设置': 'Servo Settings',
      '伺服控制': 'Servo Control',
      '伺服调试': 'Servo Debug',
      '伺服监控': 'Servo Monitor',
      
      // Alarm and status
      '报警': 'Alarm',
      '报警信息': 'Alarm Information',
      '报警代码': 'Alarm Code',
      '报警历史': 'Alarm History',
      '报警清除': 'Clear Alarm',
      '状态': 'Status',
      '运行状态': 'Running Status',
      '错误状态': 'Error Status',
      
      // Control operations
      '启动': 'Start',
      '停止': 'Stop',
      '暂停': 'Pause',
      '复位': 'Reset',
      '回零': 'Home',
      '手动': 'Manual',
      '自动': 'Auto',
      '单步': 'Single Step',
      
      // Parameters and settings
      '参数': 'Parameters',
      '参数设置': 'Parameter Settings',
      '参数配置': 'Parameter Configuration',
      '速度设置': 'Speed Setting',
      '位置设置': 'Position Setting',
      '加速度': 'Acceleration',
      '减速度': 'Deceleration',
      '最大速度': 'Maximum Speed',
      '目标位置': 'Target Position',
      '当前位置': 'Current Position',
      
      // Communication
      '通信': 'Communication',
      '通信设置': 'Communication Settings',
      '通信参数': 'Communication Parameters',
      '串口': 'Serial Port',
      '以太网': 'Ethernet',
      '波特率': 'Baud Rate',
      '数据位': 'Data Bits',
      '停止位': 'Stop Bits',
      '校验位': 'Parity',
      
      // System
      '系统': 'System',
      '系统设置': 'System Settings',
      '系统配置': 'System Configuration',
      '系统信息': 'System Information',
      '系统状态': 'System Status',
      '系统诊断': 'System Diagnosis',
      '系统维护': 'System Maintenance',
      
      // Advanced features
      '高级': 'Advanced',
      '高级设置': 'Advanced Settings',
      '高级功能': 'Advanced Features',
      '调试': 'Debug',
      '调试模式': 'Debug Mode',
      '调试信息': 'Debug Information',
      '日志': 'Log',
      '日志文件': 'Log File',
      '日志查看': 'Log Viewer'
    }
  },

  // Delta Screen Editor - HMI Screen Editor
  'delta_screen_editor': {
    name: 'Delta Screen Editor',
    description: 'Delta HMI screen editor for creating user interfaces',
    category: 'HMI',
    ocr_settings: {
      language: 'chi_sim',
      confidence_threshold: 0.7,
      font_hints: ['simsun', 'simhei']
    },
    custom_terms: {
      // Screen elements
      '画面': 'Screen',
      '画面编辑': 'Screen Editor',
      '画面设计': 'Screen Design',
      '画面属性': 'Screen Properties',
      '画面设置': 'Screen Settings',
      
      // Components
      '元件': 'Component',
      '元件库': 'Component Library',
      '标签': 'Label',
      '按钮': 'Button',
      '开关': 'Switch',
      '指示灯': 'Indicator',
      '数值显示': 'Numeric Display',
      '数值输入': 'Numeric Input',
      '文本显示': 'Text Display',
      '文本输入': 'Text Input',
      '图形': 'Graphic',
      '图片': 'Image',
      '图表': 'Chart',
      '趋势图': 'Trend Chart',
      '历史曲线': 'History Curve',
      
      // Properties
      '属性': 'Properties',
      '属性设置': 'Property Settings',
      '位置': 'Position',
      '大小': 'Size',
      '颜色': 'Color',
      '字体': 'Font',
      '背景': 'Background',
      '边框': 'Border',
      '对齐': 'Alignment',
      
      // Data binding
      '数据': 'Data',
      '数据绑定': 'Data Binding',
      '数据源': 'Data Source',
      '变量': 'Variable',
      '变量设置': 'Variable Settings',
      '地址': 'Address',
      '数据类型': 'Data Type',
      '读写': 'Read/Write',
      
      // Animation
      '动画': 'Animation',
      '动画设置': 'Animation Settings',
      '闪烁': 'Blink',
      '渐变': 'Gradient',
      '移动': 'Move',
      '缩放': 'Scale',
      '旋转': 'Rotate'
    }
  },

  // Mitsubishi GX Developer - PLC Programming
  'mitsubishi_gx': {
    name: 'Mitsubishi GX Developer',
    description: 'Mitsubishi PLC programming software',
    category: 'PLC',
    ocr_settings: {
      language: 'chi_sim',
      confidence_threshold: 0.65,
      font_hints: ['simsun', 'simhei']
    },
    custom_terms: {
      // Programming elements
      '程序': 'Program',
      '程序编辑': 'Program Editor',
      '程序列表': 'Program List',
      '程序属性': 'Program Properties',
      '梯形图': 'Ladder Diagram',
      '指令表': 'Instruction List',
      '功能块': 'Function Block',
      '结构化文本': 'Structured Text',
      
      // Instructions
      '指令': 'Instruction',
      '指令集': 'Instruction Set',
      '基本指令': 'Basic Instructions',
      '应用指令': 'Application Instructions',
      '特殊指令': 'Special Instructions',
      '功能指令': 'Function Instructions',
      
      // Soft elements
      '软元件': 'Soft Element',
      '输入': 'Input',
      '输出': 'Output',
      '内部继电器': 'Internal Relay',
      '辅助继电器': 'Auxiliary Relay',
      '定时器': 'Timer',
      '计数器': 'Counter',
      '数据寄存器': 'Data Register',
      '文件寄存器': 'File Register',
      '链接寄存器': 'Link Register',
      
      // Monitoring
      '监控': 'Monitor',
      '监控模式': 'Monitor Mode',
      '在线监控': 'Online Monitor',
      '离线监控': 'Offline Monitor',
      '强制': 'Force',
      '强制输出': 'Force Output',
      '强制输入': 'Force Input',
      '强制清除': 'Clear Force',
      
      // Communication
      '通信': 'Communication',
      '通信设置': 'Communication Settings',
      '通信测试': 'Communication Test',
      '串行通信': 'Serial Communication',
      '以太网通信': 'Ethernet Communication',
      'USB通信': 'USB Communication',
      
      // Debug
      '调试': 'Debug',
      '调试模式': 'Debug Mode',
      '断点': 'Breakpoint',
      '单步执行': 'Single Step',
      '连续执行': 'Continuous Execution',
      '停止': 'Stop',
      '运行': 'Run',
      '暂停': 'Pause'
    }
  },

  // Siemens STEP 7 - PLC Programming (Chinese Version)
  'siemens_step7': {
    name: 'Siemens STEP 7',
    description: 'Siemens PLC programming software (Chinese version)',
    category: 'PLC',
    ocr_settings: {
      language: 'chi_sim',
      confidence_threshold: 0.7,
      font_hints: ['simsun', 'simhei']
    },
    custom_terms: {
      // Project management
      '项目': 'Project',
      '项目管理': 'Project Management',
      '新建项目': 'New Project',
      '打开项目': 'Open Project',
      '保存项目': 'Save Project',
      '项目属性': 'Project Properties',
      
      // Hardware configuration
      '硬件': 'Hardware',
      '硬件配置': 'Hardware Configuration',
      '硬件目录': 'Hardware Catalog',
      '机架': 'Rack',
      '模块': 'Module',
      'CPU': 'CPU',
      '电源': 'Power Supply',
      '接口模块': 'Interface Module',
      
      // Programming
      '编程': 'Programming',
      '程序编辑器': 'Program Editor',
      '符号表': 'Symbol Table',
      '变量表': 'Variable Table',
      '数据块': 'Data Block',
      '功能块': 'Function Block',
      '组织块': 'Organization Block',
      
      // Network configuration
      '网络': 'Network',
      '网络配置': 'Network Configuration',
      '网络连接': 'Network Connection',
      '网络诊断': 'Network Diagnosis',
      'PROFIBUS': 'PROFIBUS',
      'PROFINET': 'PROFINET',
      'MPI': 'MPI',
      'AS接口': 'AS Interface',
      
      // Monitoring and diagnostics
      '监控': 'Monitor',
      '在线监控': 'Online Monitor',
      '变量监控': 'Variable Monitor',
      '诊断': 'Diagnosis',
      '诊断信息': 'Diagnostic Information',
      '诊断缓冲区': 'Diagnostic Buffer',
      '系统信息': 'System Information',
      
      // Communication
      '通信': 'Communication',
      '通信设置': 'Communication Settings',
      '通信测试': 'Communication Test',
      '下载': 'Download',
      '上传': 'Upload',
      '比较': 'Compare',
      '同步': 'Synchronize'
    }
  },

  // Omron CX-Programmer - PLC Programming
  'omron_cx': {
    name: 'Omron CX-Programmer',
    description: 'Omron PLC programming software',
    category: 'PLC',
    ocr_settings: {
      language: 'chi_sim',
      confidence_threshold: 0.65,
      font_hints: ['simsun', 'simhei']
    },
    custom_terms: {
      // Project
      '项目': 'Project',
      '项目文件': 'Project File',
      '项目设置': 'Project Settings',
      '项目属性': 'Project Properties',
      
      // PLC
      'PLC': 'PLC',
      'PLC设置': 'PLC Settings',
      'PLC信息': 'PLC Information',
      'PLC状态': 'PLC Status',
      'PLC型号': 'PLC Model',
      
      // Programming
      '编程': 'Programming',
      '程序': 'Program',
      '梯形图': 'Ladder Diagram',
      '指令': 'Instruction',
      '指令表': 'Instruction List',
      '功能块': 'Function Block',
      '结构化文本': 'Structured Text',
      
      // Memory
      '内存': 'Memory',
      '内存分配': 'Memory Allocation',
      '数据区': 'Data Area',
      '工作区': 'Work Area',
      '保持区': 'Retention Area',
      'DM区': 'DM Area',
      'HR区': 'HR Area',
      'AR区': 'AR Area',
      
      // I/O
      '输入': 'Input',
      '输出': 'Output',
      'I/O表': 'I/O Table',
      'I/O分配': 'I/O Allocation',
      'I/O监控': 'I/O Monitor',
      
      // Communication
      '通信': 'Communication',
      '通信设置': 'Communication Settings',
      '通信端口': 'Communication Port',
      '串行通信': 'Serial Communication',
      '以太网通信': 'Ethernet Communication',
      'USB通信': 'USB Communication',
      
      // Monitoring
      '监控': 'Monitor',
      '在线监控': 'Online Monitor',
      '离线监控': 'Offline Monitor',
      '强制': 'Force',
      '强制设置': 'Force Settings',
      '强制清除': 'Clear Force'
    }
  },

  // Schneider Unity Pro - PLC Programming
  'schneider_unity': {
    name: 'Schneider Unity Pro',
    description: 'Schneider Electric PLC programming software',
    category: 'PLC',
    ocr_settings: {
      language: 'chi_sim',
      confidence_threshold: 0.7,
      font_hints: ['simsun', 'simhei']
    },
    custom_terms: {
      // Project
      '项目': 'Project',
      '项目管理': 'Project Management',
      '项目属性': 'Project Properties',
      '项目设置': 'Project Settings',
      
      // Hardware
      '硬件': 'Hardware',
      '硬件配置': 'Hardware Configuration',
      '硬件目录': 'Hardware Catalog',
      '机架': 'Rack',
      '模块': 'Module',
      'CPU': 'CPU',
      '电源': 'Power Supply',
      
      // Programming
      '编程': 'Programming',
      '程序': 'Program',
      '程序编辑器': 'Program Editor',
      '梯形图': 'Ladder Diagram',
      '功能块图': 'Function Block Diagram',
      '指令表': 'Instruction List',
      '结构化文本': 'Structured Text',
      
      // Variables
      '变量': 'Variable',
      '变量表': 'Variable Table',
      '全局变量': 'Global Variable',
      '局部变量': 'Local Variable',
      '数据类型': 'Data Type',
      '变量属性': 'Variable Properties',
      
      // Communication
      '通信': 'Communication',
      '通信配置': 'Communication Configuration',
      '网络': 'Network',
      '网络配置': 'Network Configuration',
      'Modbus': 'Modbus',
      '以太网': 'Ethernet',
      '串行': 'Serial',
      
      // Monitoring
      '监控': 'Monitor',
      '在线监控': 'Online Monitor',
      '变量监控': 'Variable Monitor',
      '趋势': 'Trend',
      '趋势图': 'Trend Chart',
      '历史数据': 'Historical Data',
      
      // Diagnostics
      '诊断': 'Diagnosis',
      '诊断信息': 'Diagnostic Information',
      '系统诊断': 'System Diagnosis',
      '错误信息': 'Error Information',
      '报警': 'Alarm',
      '报警信息': 'Alarm Information'
    }
  }
};

// Export the profiles
module.exports = {
  INDUSTRIAL_PROFILES,
  
  // Helper function to get profile by name
  getProfile: (name) => INDUSTRIAL_PROFILES[name],
  
  // Helper function to get all profiles
  getAllProfiles: () => INDUSTRIAL_PROFILES,
  
  // Helper function to get profiles by category
  getProfilesByCategory: (category) => {
    return Object.entries(INDUSTRIAL_PROFILES)
      .filter(([key, profile]) => profile.category === category)
      .reduce((acc, [key, profile]) => {
        acc[key] = profile;
        return acc;
      }, {});
  },
  
  // Helper function to search profiles
  searchProfiles: (query) => {
    const results = {};
    const lowerQuery = query.toLowerCase();
    
    Object.entries(INDUSTRIAL_PROFILES).forEach(([key, profile]) => {
      if (profile.name.toLowerCase().includes(lowerQuery) ||
          profile.description.toLowerCase().includes(lowerQuery) ||
          profile.category.toLowerCase().includes(lowerQuery)) {
        results[key] = profile;
      }
    });
    
    return results;
  }
};