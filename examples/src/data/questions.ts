import { Question } from '@/types/exam';

export const networkEngineerQuestions: Question[] = [
  // 网络基础类 (20题)
  {
    id: 'q1',
    question: 'OSI七层模型中，网络层的主要功能是什么？',
    options: [
      '数据的物理传输',
      '路径选择和路由',
      '数据的封装和解封装',
      '会话的建立和管理'
    ],
    correctAnswer: 1,
    explanation: '网络层（第3层）的主要功能是路径选择和路由，决定数据从源到目的地的最佳路径。',
    category: '网络基础',
    difficulty: 'easy',
    tags: ['OSI模型', '网络层', '路由']
  },
  {
    id: 'q2',
    question: 'TCP协议相比UDP协议的主要优势是什么？',
    options: [
      '传输速度更快',
      '占用资源更少',
      '提供可靠的数据传输',
      '支持广播和组播'
    ],
    correctAnswer: 2,
    explanation: 'TCP是可靠的传输协议，提供数据完整性检查、重传机制和流量控制，确保数据可靠传输。',
    category: '传输协议',
    difficulty: 'easy',
    tags: ['TCP', 'UDP', '可靠传输']
  },
  {
    id: 'q3',
    question: '在IPv4地址中，192.168.1.0/24网络可以容纳多少台主机？',
    options: [
      '254台',
      '255台', 
      '256台',
      '253台'
    ],
    correctAnswer: 0,
    explanation: '/24表示前24位是网络位，后8位是主机位。8位主机位可表示256个地址，去掉网络地址和广播地址，实际可用254个主机地址。',
    category: 'IP地址规划',
    difficulty: 'medium',
    tags: ['IPv4', '子网掩码', 'CIDR']
  },
  {
    id: 'q4',
    question: 'VLAN的主要作用是什么？',
    options: [
      '增加网络带宽',
      '提高网络安全性和管理效率',
      '减少网络延迟',
      '支持更多的网络协议'
    ],
    correctAnswer: 1,
    explanation: 'VLAN（虚拟局域网）的主要作用是在逻辑上分割网络，提高网络安全性、减少广播域、提高管理效率。',
    category: '交换技术',
    difficulty: 'medium',
    tags: ['VLAN', '交换机', '网络安全']
  },
  {
    id: 'q5',
    question: 'RIP协议的最大跳数限制是多少？',
    options: [
      '15跳',
      '16跳',
      '255跳',
      '无限制'
    ],
    correctAnswer: 0,
    explanation: 'RIP协议规定最大跳数为15跳，16跳表示目标网络不可达。这是为了防止路由循环。',
    category: '路由协议',
    difficulty: 'medium',
    tags: ['RIP', '距离向量', '跳数']
  },
  {
    id: 'q6',
    question: '以下哪个不是OSPF协议的特点？',
    options: [
      '链路状态路由协议',
      '支持可变长子网掩码',
      '使用Bellman-Ford算法',
      '收敛速度快'
    ],
    correctAnswer: 2,
    explanation: 'OSPF使用Dijkstra算法（SPF算法），而不是Bellman-Ford算法。Bellman-Ford算法是距离向量协议（如RIP）使用的算法。',
    category: '路由协议',
    difficulty: 'hard',
    tags: ['OSPF', '链路状态', 'Dijkstra算法']
  },
  {
    id: 'q7',
    question: '防火墙工作在OSI模型的哪一层？',
    options: [
      '物理层',
      '数据链路层',
      '网络层和传输层',
      '应用层'
    ],
    correctAnswer: 2,
    explanation: '防火墙主要工作在网络层（IP地址过滤）和传输层（端口过滤），也有应用层防火墙工作在第7层。',
    category: '网络安全',
    difficulty: 'medium',
    tags: ['防火墙', '网络安全', 'OSI模型']
  },
  {
    id: 'q8',
    question: '以太网帧的最小长度是多少字节？',
    options: [
      '46字节',
      '60字节',
      '64字节',
      '1500字节'
    ],
    correctAnswer: 2,
    explanation: '以太网帧的最小长度是64字节，包括14字节帧头、46字节数据（最小）和4字节CRC校验。',
    category: '以太网技术',
    difficulty: 'medium',
    tags: ['以太网', '帧结构', '最小帧长']
  },
  {
    id: 'q9',
    question: 'DNS使用的传输层协议和端口号是？',
    options: [
      'TCP端口80',
      'UDP端口53',
      'TCP端口443',
      'UDP端口67'
    ],
    correctAnswer: 1,
    explanation: 'DNS主要使用UDP协议的53端口进行域名解析，当响应数据超过512字节时会使用TCP协议。',
    category: '应用层协议',
    difficulty: 'easy',
    tags: ['DNS', 'UDP', '端口']
  },
  {
    id: 'q10',
    question: '在子网192.168.10.0/26中，第一个可用主机地址是？',
    options: [
      '192.168.10.0',
      '192.168.10.1',
      '192.168.10.64',
      '192.168.10.65'
    ],
    correctAnswer: 1,
    explanation: '/26表示26位网络位，6位主机位。192.168.10.0是网络地址，192.168.10.1是第一个可用主机地址。',
    category: 'IP地址规划',
    difficulty: 'medium',
    tags: ['子网划分', 'IPv4', '主机地址']
  },
  {
    id: 'q11',
    question: 'STP协议的主要作用是什么？',
    options: [
      '提高网络传输速度',
      '防止网络环路',
      '负载均衡',
      '网络加密'
    ],
    correctAnswer: 1,
    explanation: 'STP（生成树协议）的主要作用是防止交换网络中的环路，通过阻塞冗余链路来维护无环拓扑。',
    category: '交换技术',
    difficulty: 'medium',
    tags: ['STP', '生成树', '环路防止']
  },
  {
    id: 'q12',
    question: 'BGP协议属于哪种类型的路由协议？',
    options: [
      '距离向量协议',
      '链路状态协议',
      '路径向量协议',
      '混合协议'
    ],
    correctAnswer: 2,
    explanation: 'BGP是路径向量协议，维护到达目标网络的完整AS路径信息，主要用于自治系统间的路由。',
    category: '路由协议',
    difficulty: 'hard',
    tags: ['BGP', '路径向量', 'AS']
  },
  {
    id: 'q13',
    question: 'CSMA/CD协议工作在OSI模型的哪一层？',
    options: [
      '物理层',
      '数据链路层',
      '网络层',
      '传输层'
    ],
    correctAnswer: 1,
    explanation: 'CSMA/CD（载波侦听多路访问/冲突检测）协议工作在数据链路层，用于以太网的介质访问控制。',
    category: '数据链路层',
    difficulty: 'medium',
    tags: ['CSMA/CD', '介质访问控制', '以太网']
  },
  {
    id: 'q14',
    question: 'IPv6地址的长度是多少位？',
    options: [
      '32位',
      '64位',
      '128位',
      '256位'
    ],
    correctAnswer: 2,
    explanation: 'IPv6地址长度为128位，通常用冒号十六进制表示法表示，解决了IPv4地址不足的问题。',
    category: 'IPv6技术',
    difficulty: 'easy',
    tags: ['IPv6', '地址长度', '128位']
  },
  {
    id: 'q15',
    question: '网桥工作在OSI模型的哪一层？',
    options: [
      '物理层',
      '数据链路层',
      '网络层',
      '传输层'
    ],
    correctAnswer: 1,
    explanation: '网桥工作在数据链路层，通过学习MAC地址表来转发帧，可以分割冲突域。',
    category: '网络设备',
    difficulty: 'easy',
    tags: ['网桥', '数据链路层', 'MAC地址']
  },
  {
    id: 'q16',
    question: 'HTTPS使用的默认端口号是？',
    options: [
      '80',
      '443',
      '8080',
      '8443'
    ],
    correctAnswer: 1,
    explanation: 'HTTPS（HTTP over SSL/TLS）使用443端口，提供加密的HTTP通信。',
    category: '应用层协议',
    difficulty: 'easy',
    tags: ['HTTPS', 'SSL/TLS', '端口443']
  },
  {
    id: 'q17',
    question: '在TCP三次握手过程中，第二次握手发送的是？',
    options: [
      'SYN',
      'ACK',
      'SYN+ACK',
      'FIN'
    ],
    correctAnswer: 2,
    explanation: 'TCP三次握手的第二次握手，服务器发送SYN+ACK报文，确认客户端的连接请求并发送自己的连接请求。',
    category: '传输协议',
    difficulty: 'medium',
    tags: ['TCP', '三次握手', 'SYN+ACK']
  },
  {
    id: 'q18',
    question: 'DHCP服务器分配IP地址的过程包含几个步骤？',
    options: [
      '2个步骤',
      '3个步骤',
      '4个步骤',
      '5个步骤'
    ],
    correctAnswer: 2,
    explanation: 'DHCP分配IP地址包含4个步骤：Discover（发现）、Offer（提供）、Request（请求）、Acknowledge（确认）。',
    category: '网络服务',
    difficulty: 'medium',
    tags: ['DHCP', 'IP分配', 'DORA过程']
  },
  {
    id: 'q19',
    question: '单模光纤和多模光纤的主要区别是什么？',
    options: [
      '材料不同',
      '纤芯直径不同',
      '颜色不同',
      '长度不同'
    ],
    correctAnswer: 1,
    explanation: '单模光纤纤芯直径约9微米，只传输一种模式的光；多模光纤纤芯直径约62.5微米，可传输多种模式的光。',
    category: '物理层技术',
    difficulty: 'medium',
    tags: ['光纤', '单模', '多模']
  },
  {
    id: 'q20',
    question: 'NAT技术的主要作用是什么？',
    options: [
      '提高网络速度',
      '节约IPv4地址并提供安全性',
      '加密网络数据',
      '负载均衡'
    ],
    correctAnswer: 1,
    explanation: 'NAT（网络地址转换）主要作用是节约IPv4地址，通过将内网私有地址转换为公网地址，同时提供一定的安全性。',
    category: '网络技术',
    difficulty: 'medium',
    tags: ['NAT', 'IPv4', '地址转换']
  },
  {
    id: 'q21',
    question: '在OSPF协议中，Hello包的作用是什么？',
    options: [
      '传输路由信息',
      '发现邻居和维持邻居关系',
      '计算最短路径',
      '同步数据库'
    ],
    correctAnswer: 1,
    explanation: 'OSPF的Hello包用于发现邻居路由器、建立和维持邻居关系，以及选举DR和BDR。',
    category: '路由协议',
    difficulty: 'hard',
    tags: ['OSPF', 'Hello包', '邻居发现']
  },
  {
    id: 'q22',
    question: 'SNMP协议使用的传输层协议和端口号是？',
    options: [
      'TCP 161',
      'UDP 161',
      'TCP 162',
      'UDP 162'
    ],
    correctAnswer: 1,
    explanation: 'SNMP（简单网络管理协议）使用UDP协议的161端口进行网络设备管理，162端口用于Trap消息。',
    category: '网络管理',
    difficulty: 'medium',
    tags: ['SNMP', 'UDP', '网络管理']
  },
  {
    id: 'q23',
    question: '以下哪种攻击属于被动攻击？',
    options: [
      'DDoS攻击',
      '窃听攻击',
      'SQL注入',
      'ARP欺骗'
    ],
    correctAnswer: 1,
    explanation: '窃听攻击是被动攻击，攻击者只监听和分析网络流量，不修改数据。其他选项都属于主动攻击。',
    category: '网络安全',
    difficulty: 'medium',
    tags: ['被动攻击', '窃听', '网络安全']
  },
  {
    id: 'q24',
    question: '10BASE-T以太网的最大传输距离是多少？',
    options: [
      '100米',
      '185米',
      '500米',
      '2000米'
    ],
    correctAnswer: 0,
    explanation: '10BASE-T使用双绞线，最大传输距离为100米。这是IEEE 802.3标准规定的距离限制。',
    category: '以太网技术',
    difficulty: 'easy',
    tags: ['10BASE-T', '双绞线', '传输距离']
  },
  {
    id: 'q25',
    question: 'PPP协议工作在OSI模型的哪一层？',
    options: [
      '物理层',
      '数据链路层',
      '网络层',
      '传输层'
    ],
    correctAnswer: 1,
    explanation: 'PPP（点对点协议）工作在数据链路层，常用于拨号连接和专线连接，提供认证、加密等功能。',
    category: '数据链路层',
    difficulty: 'easy',
    tags: ['PPP', '点对点协议', '数据链路层']
  },
  {
    id: 'q26',
    question: 'MPLS的全称是什么？',
    options: [
      'Multi-Protocol Label Switching',
      'Multiple Path Link State',
      'Multi-Point Line Switching',
      'Media Protocol Link Service'
    ],
    correctAnswer: 0,
    explanation: 'MPLS是Multi-Protocol Label Switching（多协议标签交换），是一种在开放的通信网上利用标签引导数据快速转发的新技术。',
    category: '网络技术',
    difficulty: 'hard',
    tags: ['MPLS', '标签交换', '多协议']
  },
  {
    id: 'q27',
    question: '千兆以太网1000BASE-T使用几对双绞线？',
    options: [
      '1对',
      '2对',
      '3对',
      '4对'
    ],
    correctAnswer: 3,
    explanation: '1000BASE-T千兆以太网需要使用全部4对双绞线进行数据传输，与百兆以太网的2对不同。',
    category: '以太网技术',
    difficulty: 'medium',
    tags: ['千兆以太网', '1000BASE-T', '双绞线']
  },
  {
    id: 'q28',
    question: 'VPN的主要优势是什么？',
    options: [
      '提高网络速度',
      '节约成本并提供安全的远程访问',
      '增加网络带宽',
      '简化网络配置'
    ],
    correctAnswer: 1,
    explanation: 'VPN（虚拟专用网络）的主要优势是通过公网建立安全的专用连接，节约专线成本并提供安全的远程访问。',
    category: '网络安全',
    difficulty: 'easy',
    tags: ['VPN', '远程访问', '网络安全']
  },
  {
    id: 'q29',
    question: '路由器的主要功能是什么？',
    options: [
      '信号放大',
      '数据过滤',
      '路径选择和数据转发',
      '数据加密'
    ],
    correctAnswer: 2,
    explanation: '路由器工作在网络层，主要功能是根据路由表进行路径选择和数据包转发，连接不同的网络。',
    category: '网络设备',
    difficulty: 'easy',
    tags: ['路由器', '路径选择', '数据转发']
  },
  {
    id: 'q30',
    question: 'TCP流量控制使用的机制是什么？',
    options: [
      '拥塞窗口',
      '滑动窗口',
      '超时重传',
      '快速重传'
    ],
    correctAnswer: 1,
    explanation: 'TCP使用滑动窗口机制进行流量控制，接收方通过窗口大小告知发送方可以发送的数据量。',
    category: '传输协议',
    difficulty: 'hard',
    tags: ['TCP', '流量控制', '滑动窗口']
  },
  {
    id: 'q31',
    question: 'OSI模型中，表示层的主要功能是什么？',
    options: [
      '路由选择',
      '数据加密和压缩',
      '错误检测和纠正',
      '建立连接'
    ],
    correctAnswer: 1,
    explanation: '表示层（第6层）负责数据的格式化、加密解密、压缩解压等功能，确保数据能被应用层正确理解。',
    category: '网络基础',
    difficulty: 'medium',
    tags: ['OSI模型', '表示层', '数据格式化']
  },
  {
    id: 'q32',
    question: '会话层在OSI模型中的作用是什么？',
    options: [
      '管理应用程序之间的会话',
      '提供可靠的数据传输',
      '进行路径选择',
      '物理信号传输'
    ],
    correctAnswer: 0,
    explanation: '会话层（第5层）负责建立、管理和终止应用程序之间的会话，提供会话控制服务。',
    category: '网络基础',
    difficulty: 'medium',
    tags: ['OSI模型', '会话层', '会话管理']
  },
  {
    id: 'q33',
    question: '数据链路层的主要功能不包括以下哪项？',
    options: [
      '帧同步',
      '错误检测',
      '路径选择',
      '流量控制'
    ],
    correctAnswer: 2,
    explanation: '路径选择是网络层的功能，数据链路层主要负责帧同步、错误检测、流量控制和介质访问控制。',
    category: '网络基础',
    difficulty: 'easy',
    tags: ['OSI模型', '数据链路层', '功能']
  },
  {
    id: 'q34',
    question: '物理层定义的是什么？',
    options: [
      '数据的逻辑格式',
      '电气、机械和功能特性',
      '路由算法',
      '协议规则'
    ],
    correctAnswer: 1,
    explanation: '物理层定义传输媒体的电气特性、机械特性、功能特性和规程特性，负责比特流的传输。',
    category: '网络基础',
    difficulty: 'easy',
    tags: ['OSI模型', '物理层', '特性定义']
  },
  {
    id: 'q35',
    question: 'TCP协议的拥塞控制算法包括哪些阶段？',
    options: [
      '慢启动和拥塞避免',
      '快重传和快恢复',
      '慢启动、拥塞避免、快重传和快恢复',
      '只有慢启动'
    ],
    correctAnswer: 2,
    explanation: 'TCP拥塞控制包括四个算法：慢启动、拥塞避免、快重传和快恢复，协同工作避免网络拥塞。',
    category: '传输协议',
    difficulty: 'hard',
    tags: ['TCP', '拥塞控制', '算法']
  },
  {
    id: 'q36',
    question: 'UDP协议的特点不包括以下哪项？',
    options: [
      '无连接',
      '不可靠传输',
      '有序传输',
      '低开销'
    ],
    correctAnswer: 2,
    explanation: 'UDP是无连接、不可靠、无序传输的协议，但开销小、速度快，不保证数据的有序性。',
    category: '传输协议',
    difficulty: 'easy',
    tags: ['UDP', '协议特点', '无序传输']
  },
  {
    id: 'q37',
    question: 'TCP连接释放需要几次握手？',
    options: [
      '2次',
      '3次',
      '4次',
      '5次'
    ],
    correctAnswer: 2,
    explanation: 'TCP连接释放需要4次握手（四次挥手），因为TCP是全双工连接，每个方向都需要单独关闭。',
    category: '传输协议',
    difficulty: 'medium',
    tags: ['TCP', '四次挥手', '连接释放']
  },
  {
    id: 'q38',
    question: 'TCP的TIME_WAIT状态的作用是什么？',
    options: [
      '等待更多数据',
      '确保远程端收到ACK并防止旧连接干扰',
      '重新建立连接',
      '检测网络错误'
    ],
    correctAnswer: 1,
    explanation: 'TIME_WAIT状态确保远程端收到最后的ACK，并防止旧连接的延迟报文干扰新连接。',
    category: '传输协议',
    difficulty: 'hard',
    tags: ['TCP', 'TIME_WAIT', '状态机']
  },
  {
    id: 'q39',
    question: '子网掩码255.255.240.0对应的CIDR表示法是？',
    options: [
      '/20',
      '/21',
      '/22',
      '/24'
    ],
    correctAnswer: 0,
    explanation: '255.255.240.0转换为二进制有20个连续的1，因此CIDR表示法为/20。',
    category: 'IP地址规划',
    difficulty: 'medium',
    tags: ['子网掩码', 'CIDR', '二进制转换']
  },
  {
    id: 'q40',
    question: '私有IP地址范围不包括以下哪个？',
    options: [
      '10.0.0.0-10.255.255.255',
      '172.16.0.0-172.31.255.255',
      '192.168.0.0-192.168.255.255',
      '169.254.0.0-169.254.255.255'
    ],
    correctAnswer: 3,
    explanation: '169.254.0.0/16是APIPA（自动专用IP地址）范围，不是RFC1918定义的私有地址。',
    category: 'IP地址规划',
    difficulty: 'medium',
    tags: ['私有IP', 'RFC1918', 'APIPA']
  },
  {
    id: 'q41',
    question: 'VLSM的全称是什么？',
    options: [
      'Variable Length Subnet Mask',
      'Virtual LAN Subnet Mask',
      'Very Large Subnet Mask',
      'Variable Link State Mask'
    ],
    correctAnswer: 0,
    explanation: 'VLSM是Variable Length Subnet Mask（可变长子网掩码），允许在同一网络中使用不同长度的子网掩码。',
    category: 'IP地址规划',
    difficulty: 'medium',
    tags: ['VLSM', '可变长子网掩码', '地址规划']
  },
  {
    id: 'q42',
    question: '192.168.1.100/28所在子网的广播地址是？',
    options: [
      '192.168.1.111',
      '192.168.1.127',
      '192.168.1.255',
      '192.168.1.15'
    ],
    correctAnswer: 0,
    explanation: '/28表示28位网络位，4位主机位。192.168.1.100在192.168.1.96/28子网中，广播地址为192.168.1.111。',
    category: 'IP地址规划',
    difficulty: 'hard',
    tags: ['子网计算', '广播地址', '网络规划']
  },
  {
    id: 'q43',
    question: 'VLAN Trunking协议（VTP）的作用是什么？',
    options: [
      '加密VLAN流量',
      '自动同步VLAN配置信息',
      '负载均衡',
      '防止VLAN攻击'
    ],
    correctAnswer: 1,
    explanation: 'VTP用于在交换机之间自动同步VLAN配置信息，简化VLAN管理。',
    category: '交换技术',
    difficulty: 'medium',
    tags: ['VTP', 'VLAN', '配置同步']
  },
  {
    id: 'q44',
    question: '以下哪种是Trunk端口的特点？',
    options: [
      '只能传输一个VLAN的流量',
      '可以传输多个VLAN的流量',
      '不能配置VLAN',
      '只用于管理'
    ],
    correctAnswer: 1,
    explanation: 'Trunk端口可以传输多个VLAN的流量，通过VLAN标签区分不同VLAN的帧。',
    category: '交换技术',
    difficulty: 'easy',
    tags: ['Trunk', 'VLAN', '端口类型']
  },
  {
    id: 'q45',
    question: 'IEEE 802.1Q标准定义的是什么？',
    options: [
      'STP协议',
      'VLAN标签',
      '以太网标准',
      '无线网络'
    ],
    correctAnswer: 1,
    explanation: 'IEEE 802.1Q定义了VLAN标签的格式和实现方法，在以太网帧中添加4字节的VLAN标签。',
    category: '交换技术',
    difficulty: 'medium',
    tags: ['802.1Q', 'VLAN标签', 'IEEE标准']
  },
  {
    id: 'q46',
    question: '交换机的CAM表存储的是什么信息？',
    options: [
      'IP地址和端口的映射',
      'MAC地址和端口的映射',
      'VLAN和端口的映射',
      '路由信息'
    ],
    correctAnswer: 1,
    explanation: 'CAM表（内容可寻址存储器表）存储MAC地址和交换机端口的映射关系，用于帧转发决策。',
    category: '交换技术',
    difficulty: 'easy',
    tags: ['CAM表', 'MAC地址', '交换机']
  },
  {
    id: 'q47',
    question: 'EIGRP协议使用的算法是什么？',
    options: [
      'Dijkstra算法',
      'Bellman-Ford算法',
      'DUAL算法',
      'Floyd算法'
    ],
    correctAnswer: 2,
    explanation: 'EIGRP使用DUAL（Diffusing Update Algorithm）算法，确保无环路由和快速收敛。',
    category: '路由协议',
    difficulty: 'hard',
    tags: ['EIGRP', 'DUAL算法', '路由协议']
  },
  {
    id: 'q48',
    question: 'OSPF协议中，LSA的全称是什么？',
    options: [
      'Link State Advertisement',
      'Local System Address',
      'Link System Algorithm',
      'Local State Algorithm'
    ],
    correctAnswer: 0,
    explanation: 'LSA是Link State Advertisement（链路状态通告），OSPF路由器通过LSA交换链路状态信息。',
    category: '路由协议',
    difficulty: 'medium',
    tags: ['OSPF', 'LSA', '链路状态']
  },
  {
    id: 'q49',
    question: 'IS-IS协议属于哪种类型的路由协议？',
    options: [
      '距离向量协议',
      '链路状态协议',
      '路径向量协议',
      '混合协议'
    ],
    correctAnswer: 1,
    explanation: 'IS-IS（Intermediate System to Intermediate System）是链路状态路由协议，类似于OSPF。',
    category: '路由协议',
    difficulty: 'hard',
    tags: ['IS-IS', '链路状态', '路由协议']
  },
  {
    id: 'q50',
    question: 'OSPF协议的管理距离（AD值）是多少？',
    options: [
      '90',
      '100',
      '110',
      '120'
    ],
    correctAnswer: 2,
    explanation: 'OSPF协议的管理距离是110，用于确定路由协议的优先级，值越小优先级越高。',
    category: '路由协议',
    difficulty: 'medium',
    tags: ['OSPF', '管理距离', 'AD值']
  },
  {
    id: 'q51',
    question: 'IDS和IPS的主要区别是什么？',
    options: [
      'IDS主动防护，IPS被动监测',
      'IDS被动监测，IPS主动防护',
      '没有区别',
      'IDS用于内网，IPS用于外网'
    ],
    correctAnswer: 1,
    explanation: 'IDS（入侵检测系统）被动监测和报告攻击，IPS（入侵防护系统）主动阻止攻击。',
    category: '网络安全',
    difficulty: 'medium',
    tags: ['IDS', 'IPS', '入侵检测']
  },
  {
    id: 'q52',
    question: 'DMZ区域的主要作用是什么？',
    options: [
      '提高网络速度',
      '在内网和外网之间提供缓冲区',
      '加密数据传输',
      '负载均衡'
    ],
    correctAnswer: 1,
    explanation: 'DMZ（非军事化区域）在内网和外网之间提供缓冲区，放置对外提供服务的服务器。',
    category: '网络安全',
    difficulty: 'medium',
    tags: ['DMZ', '缓冲区', '网络安全']
  },
  {
    id: 'q53',
    question: 'SSL/TLS工作在OSI模型的哪一层？',
    options: [
      '传输层',
      '会话层',
      '表示层',
      '应用层'
    ],
    correctAnswer: 2,
    explanation: 'SSL/TLS工作在表示层，为应用层提供加密、认证和数据完整性保护。',
    category: '网络安全',
    difficulty: 'medium',
    tags: ['SSL/TLS', '表示层', '加密']
  },
  {
    id: 'q54',
    question: 'ARP欺骗攻击的原理是什么？',
    options: [
      '伪造IP地址',
      '伪造MAC地址和IP地址的映射关系',
      '拦截DNS查询',
      '暴力破解密码'
    ],
    correctAnswer: 1,
    explanation: 'ARP欺骗通过发送虚假的ARP响应，伪造MAC地址和IP地址的映射关系，重定向网络流量。',
    category: '网络安全',
    difficulty: 'medium',
    tags: ['ARP欺骗', 'MAC地址', 'IP映射']
  },
  {
    id: 'q55',
    question: '万兆以太网10GBASE-T的标准线缆是什么？',
    options: [
      'Cat5e',
      'Cat6',
      'Cat6A',
      'Cat7'
    ],
    correctAnswer: 2,
    explanation: '10GBASE-T需要至少Cat6A级别的双绞线才能支持100米距离的万兆传输。',
    category: '以太网技术',
    difficulty: 'medium',
    tags: ['万兆以太网', '10GBASE-T', 'Cat6A']
  },
  {
    id: 'q56',
    question: '以太网的CSMA/CD算法中，最小帧间间隔是多少？',
    options: [
      '9.6微秒',
      '96位时间',
      '512位时间',
      '64字节时间'
    ],
    correctAnswer: 1,
    explanation: '以太网规定最小帧间间隔为96位时间（9.6微秒），确保接收方有足够时间处理前一帧。',
    category: '以太网技术',
    difficulty: 'hard',
    tags: ['CSMA/CD', '帧间间隔', '以太网']
  },
  {
    id: 'q57',
    question: '以太网MAC地址的长度是多少位？',
    options: [
      '32位',
      '48位',
      '64位',
      '128位'
    ],
    correctAnswer: 1,
    explanation: 'MAC地址长度为48位（6字节），前24位是厂商标识符，后24位是设备标识符。',
    category: '以太网技术',
    difficulty: 'easy',
    tags: ['MAC地址', '48位', '设备标识']
  },
  {
    id: 'q58',
    question: '以太网的自动协商机制可以协商什么参数？',
    options: [
      '只有速度',
      '只有双工模式',
      '速度和双工模式',
      '速度、双工模式和流量控制'
    ],
    correctAnswer: 3,
    explanation: '以太网自动协商可以协商传输速度、双工模式和流量控制等参数，实现最佳的连接配置。',
    category: '以太网技术',
    difficulty: 'medium',
    tags: ['自动协商', '双工模式', '流量控制']
  },
  {
    id: 'q59',
    question: 'HTTP/2相比HTTP/1.1的主要改进是什么？',
    options: [
      '更好的安全性',
      '多路复用和服务器推送',
      '更简单的协议',
      '更小的头部'
    ],
    correctAnswer: 1,
    explanation: 'HTTP/2的主要改进包括多路复用、服务器推送、头部压缩等，提高了性能和效率。',
    category: '应用层协议',
    difficulty: 'medium',
    tags: ['HTTP/2', '多路复用', '服务器推送']
  },
  {
    id: 'q60',
    question: 'SMTP协议使用的默认端口号是？',
    options: [
      '21',
      '25',
      '110',
      '143'
    ],
    correctAnswer: 1,
    explanation: 'SMTP（简单邮件传输协议）使用25端口发送邮件，587端口用于客户端提交。',
    category: '应用层协议',
    difficulty: 'easy',
    tags: ['SMTP', '端口25', '邮件传输']
  },
  {
    id: 'q61',
    question: 'FTP协议使用几个端口？',
    options: [
      '1个',
      '2个',
      '3个',
      '4个'
    ],
    correctAnswer: 1,
    explanation: 'FTP使用两个端口：21端口用于控制连接，20端口用于数据连接（主动模式）。',
    category: '应用层协议',
    difficulty: 'medium',
    tags: ['FTP', '双端口', '控制连接']
  },
  {
    id: 'q62',
    question: 'Telnet协议的默认端口号是？',
    options: [
      '22',
      '23',
      '24',
      '25'
    ],
    correctAnswer: 1,
    explanation: 'Telnet使用23端口提供远程登录服务，但由于安全问题现多被SSH替代。',
    category: '应用层协议',
    difficulty: 'easy',
    tags: ['Telnet', '端口23', '远程登录']
  },
  {
    id: 'q63',
    question: 'IPv6地址fe80::/10表示什么类型的地址？',
    options: [
      '全局单播地址',
      '链路本地地址',
      '多播地址',
      '回环地址'
    ],
    correctAnswer: 1,
    explanation: 'fe80::/10是IPv6链路本地地址前缀，用于同一链路上的通信，不能被路由。',
    category: 'IPv6技术',
    difficulty: 'medium',
    tags: ['IPv6', '链路本地地址', 'fe80']
  },
  {
    id: 'q64',
    question: 'IPv6的环回地址是什么？',
    options: [
      '::1',
      '127.0.0.1',
      'fe80::1',
      '::ffff:0:0'
    ],
    correctAnswer: 0,
    explanation: 'IPv6的环回地址是::1，等同于IPv4的127.0.0.1，用于本地测试。',
    category: 'IPv6技术',
    difficulty: 'easy',
    tags: ['IPv6', '环回地址', '::1']
  },
  {
    id: 'q65',
    question: 'IPv6的邻居发现协议（NDP）的作用是什么？',
    options: [
      '地址自动配置',
      '重复地址检测',
      '邻居可达性检测',
      '以上都是'
    ],
    correctAnswer: 3,
    explanation: 'NDP协议综合了IPv4中ARP、ICMP重定向等功能，包括地址自动配置、重复地址检测、邻居可达性检测等。',
    category: 'IPv6技术',
    difficulty: 'hard',
    tags: ['IPv6', 'NDP', '邻居发现']
  },
  {
    id: 'q66',
    question: 'IPv6无状态地址自动配置（SLAAC）的过程包括什么？',
    options: [
      '只需要路由器通告',
      '前缀+接口标识符',
      '需要DHCPv6服务器',
      '手动配置'
    ],
    correctAnswer: 1,
    explanation: 'SLAAC通过路由器通告获取网络前缀，结合接口标识符（通常基于MAC地址）自动生成IPv6地址。',
    category: 'IPv6技术',
    difficulty: 'medium',
    tags: ['IPv6', 'SLAAC', '自动配置']
  },
  {
    id: 'q67',
    question: '集线器（Hub）工作在OSI模型的哪一层？',
    options: [
      '物理层',
      '数据链路层',
      '网络层',
      '传输层'
    ],
    correctAnswer: 0,
    explanation: '集线器工作在物理层，只是简单的信号放大和转发设备，所有端口共享一个冲突域。',
    category: '网络设备',
    difficulty: 'easy',
    tags: ['集线器', '物理层', '冲突域']
  },
  {
    id: 'q68',
    question: '交换机相比集线器的主要优势是什么？',
    options: [
      '成本更低',
      '每个端口独立的冲突域',
      '传输距离更远',
      '配置更简单'
    ],
    correctAnswer: 1,
    explanation: '交换机为每个端口提供独立的冲突域，避免冲突，提高网络效率，支持全双工通信。',
    category: '网络设备',
    difficulty: 'easy',
    tags: ['交换机', '冲突域', '全双工']
  },
  {
    id: 'q69',
    question: '三层交换机的主要特点是什么？',
    options: [
      '只能工作在数据链路层',
      '集成了路由功能的交换机',
      '只支持VLAN',
      '传输速度更快'
    ],
    correctAnswer: 1,
    explanation: '三层交换机集成了路由功能，可以在不同VLAN之间进行路由，提供线速的三层转发。',
    category: '网络设备',
    difficulty: 'medium',
    tags: ['三层交换机', '路由功能', 'VLAN间路由']
  },
  {
    id: 'q70',
    question: '负载均衡器的主要作用是什么？',
    options: [
      '提高安全性',
      '分发流量到多个服务器',
      '加密数据传输',
      '过滤恶意流量'
    ],
    correctAnswer: 1,
    explanation: '负载均衡器将客户端请求分发到多个后端服务器，提高系统可用性和性能。',
    category: '网络设备',
    difficulty: 'easy',
    tags: ['负载均衡器', '流量分发', '高可用']
  },
  {
    id: 'q71',
    question: 'HDLC协议的全称是什么？',
    options: [
      'High-level Data Link Control',
      'Hardware Data Link Control',
      'High-speed Data Link Control',
      'Hybrid Data Link Control'
    ],
    correctAnswer: 0,
    explanation: 'HDLC是High-level Data Link Control（高级数据链路控制）协议，是一种位导向的数据链路层协议。',
    category: '数据链路层',
    difficulty: 'medium',
    tags: ['HDLC', '数据链路控制', '位导向']
  },
  {
    id: 'q72',
    question: 'Frame Relay的主要特点是什么？',
    options: [
      '面向连接的可靠传输',
      '面向连接的不可靠传输',
      '无连接的可靠传输',
      '无连接的不可靠传输'
    ],
    correctAnswer: 1,
    explanation: 'Frame Relay是面向连接但不可靠的数据链路层协议，不提供错误恢复和流量控制。',
    category: '数据链路层',
    difficulty: 'medium',
    tags: ['Frame Relay', '面向连接', '不可靠传输']
  },
  {
    id: 'q73',
    question: 'ATM协议使用的信元大小是多少字节？',
    options: [
      '48字节',
      '50字节',
      '52字节',
      '53字节'
    ],
    correctAnswer: 3,
    explanation: 'ATM使用固定长度的53字节信元，包括5字节头部和48字节有效载荷。',
    category: '数据链路层',
    difficulty: 'medium',
    tags: ['ATM', '信元', '53字节']
  },
  {
    id: 'q74',
    question: '以下哪个不是停等协议的特点？',
    options: [
      '发送方发送一帧后等待确认',
      '简单可靠',
      '信道利用率高',
      '需要超时重传机制'
    ],
    correctAnswer: 2,
    explanation: '停等协议的信道利用率较低，因为发送方必须等待每一帧的确认才能发送下一帧。',
    category: '数据链路层',
    difficulty: 'medium',
    tags: ['停等协议', '信道利用率', '确认机制']
  },
  {
    id: 'q75',
    question: 'DHCP服务器的IP地址池耗尽时会发生什么？',
    options: [
      '自动扩展地址池',
      '无法为新客户端分配IP地址',
      '重新分配已使用的地址',
      '服务器自动重启'
    ],
    correctAnswer: 1,
    explanation: '当DHCP地址池耗尽时，服务器无法为新的客户端分配IP地址，新客户端将无法获得网络配置。',
    category: '网络服务',
    difficulty: 'easy',
    tags: ['DHCP', '地址池', 'IP分配']
  },
  {
    id: 'q76',
    question: 'DHCP租约时间的作用是什么？',
    options: [
      '限制用户上网时间',
      '控制IP地址使用期限',
      '设置认证时间',
      '配置超时时间'
    ],
    correctAnswer: 1,
    explanation: 'DHCP租约时间控制客户端可以使用分配IP地址的时间，到期后需要续约或重新申请。',
    category: '网络服务',
    difficulty: 'medium',
    tags: ['DHCP', '租约时间', 'IP使用期限']
  },
  {
    id: 'q77',
    question: 'NTP协议的主要作用是什么？',
    options: [
      '文件传输',
      '时间同步',
      '邮件传输',
      '远程登录'
    ],
    correctAnswer: 1,
    explanation: 'NTP（网络时间协议）用于网络中设备之间的时间同步，确保时间的准确性和一致性。',
    category: '网络服务',
    difficulty: 'easy',
    tags: ['NTP', '时间同步', '网络协议']
  },
  {
    id: 'q78',
    question: 'RADIUS协议主要用于什么？',
    options: [
      '路由协议',
      '认证、授权和计费',
      '文件传输',
      '时间同步'
    ],
    correctAnswer: 1,
    explanation: 'RADIUS是AAA协议，提供认证（Authentication）、授权（Authorization）和计费（Accounting）服务。',
    category: '网络服务',
    difficulty: 'medium',
    tags: ['RADIUS', 'AAA', '认证授权']
  },
  {
    id: 'q79',
    question: '光纤传输的主要优势不包括以下哪项？',
    options: [
      '传输距离远',
      '抗电磁干扰',
      '安装简单',
      '带宽大'
    ],
    correctAnswer: 2,
    explanation: '光纤传输距离远、抗电磁干扰、带宽大，但安装和连接相对复杂，需要专业设备和技术。',
    category: '物理层技术',
    difficulty: 'easy',
    tags: ['光纤', '传输优势', '安装复杂']
  },
  {
    id: 'q80',
    question: '双绞线中的"双绞"设计是为了什么？',
    options: [
      '增加强度',
      '减少串扰和电磁干扰',
      '降低成本',
      '提高速度'
    ],
    correctAnswer: 1,
    explanation: '双绞线的绞合设计可以有效减少线对之间的串扰和外部电磁干扰，提高信号质量。',
    category: '物理层技术',
    difficulty: 'medium',
    tags: ['双绞线', '串扰', '电磁干扰']
  },
  {
    id: 'q81',
    question: '以下哪种传输介质的带宽最大？',
    options: [
      '同轴电缆',
      '双绞线',
      '光纤',
      '无线电波'
    ],
    correctAnswer: 2,
    explanation: '光纤具有最大的带宽，可以支持极高的数据传输速率，远超其他传输介质。',
    category: '物理层技术',
    difficulty: 'easy',
    tags: ['光纤', '带宽', '传输介质']
  },
  {
    id: 'q82',
    question: '曼彻斯特编码的特点是什么？',
    options: [
      '每位用两个信号周期表示',
      '自同步，无需单独时钟信号',
      '频谱效率高',
      '编码简单'
    ],
    correctAnswer: 1,
    explanation: '曼彻斯特编码的主要特点是自同步，每个位都包含时钟信息，无需单独的时钟信号。',
    category: '物理层技术',
    difficulty: 'hard',
    tags: ['曼彻斯特编码', '自同步', '时钟信息']
  },
  {
    id: 'q83',
    question: 'SDN的全称是什么？',
    options: [
      'Software Defined Network',
      'System Defined Network',
      'Service Defined Network',
      'Standard Defined Network'
    ],
    correctAnswer: 0,
    explanation: 'SDN是Software Defined Network（软件定义网络），通过软件控制器集中管理网络。',
    category: '网络技术',
    difficulty: 'medium',
    tags: ['SDN', '软件定义网络', '集中控制']
  },
  {
    id: 'q84',
    question: 'CDN的主要作用是什么？',
    options: [
      '网络安全',
      '内容分发和加速',
      '负载均衡',
      '数据备份'
    ],
    correctAnswer: 1,
    explanation: 'CDN（内容分发网络）通过在全球部署缓存节点，就近为用户提供内容，提高访问速度。',
    category: '网络技术',
    difficulty: 'easy',
    tags: ['CDN', '内容分发', '加速']
  },
  {
    id: 'q85',
    question: 'QoS的主要目标是什么？',
    options: [
      '提高网络安全',
      '保证网络服务质量',
      '降低网络成本',
      '简化网络管理'
    ],
    correctAnswer: 1,
    explanation: 'QoS（服务质量）的目标是保证网络服务质量，为不同类型的流量提供差异化的服务保证。',
    category: '网络技术',
    difficulty: 'medium',
    tags: ['QoS', '服务质量', '差异化服务']
  },
  {
    id: 'q86',
    question: 'VXLAN技术的主要用途是什么？',
    options: [
      '网络安全',
      '虚拟化网络扩展',
      '负载均衡',
      '路由优化'
    ],
    correctAnswer: 1,
    explanation: 'VXLAN（Virtual Extensible LAN）用于数据中心虚拟化网络扩展，解决VLAN数量限制问题。',
    category: '网络技术',
    difficulty: 'hard',
    tags: ['VXLAN', '虚拟化', '网络扩展']
  },
  {
    id: 'q87',
    question: 'SNMP v3相比v2c的主要改进是什么？',
    options: [
      '更好的性能',
      '更多的管理功能',
      '增加了安全特性',
      '更简单的配置'
    ],
    correctAnswer: 2,
    explanation: 'SNMP v3增加了用户认证、数据加密和访问控制等安全特性，解决了早期版本的安全问题。',
    category: '网络管理',
    difficulty: 'medium',
    tags: ['SNMP v3', '安全特性', '认证加密']
  },
  {
    id: 'q88',
    question: 'Syslog的默认端口号是？',
    options: [
      '514',
      '515',
      '520',
      '521'
    ],
    correctAnswer: 0,
    explanation: 'Syslog使用UDP 514端口传输日志消息，是网络设备和系统日志管理的标准协议。',
    category: '网络管理',
    difficulty: 'easy',
    tags: ['Syslog', 'UDP 514', '日志管理']
  },
  {
    id: 'q89',
    question: 'NETCONF协议使用的传输协议是什么？',
    options: [
      'HTTP',
      'HTTPS',
      'SSH',
      'Telnet'
    ],
    correctAnswer: 2,
    explanation: 'NETCONF通常基于SSH传输，提供安全的网络设备配置管理，支持事务和回滚功能。',
    category: '网络管理',
    difficulty: 'medium',
    tags: ['NETCONF', 'SSH', '配置管理']
  },
  {
    id: 'q90',
    question: '网络监控中的带宽利用率通常以什么单位表示？',
    options: [
      '字节/秒',
      '位/秒',
      '百分比',
      '包/秒'
    ],
    correctAnswer: 2,
    explanation: '带宽利用率通常以百分比表示，显示当前使用的带宽占总带宽的比例，便于理解和监控。',
    category: '网络管理',
    difficulty: 'easy',
    tags: ['带宽利用率', '百分比', '网络监控']
  },
  
  // 网络基础类别补充题目 (q91-q105)
  {
    id: 'q91',
    question: '物理层的主要功能是什么？',
    options: [
      '数据加密',
      '电信号的传输和接收',
      '错误检测',
      '路径选择'
    ],
    correctAnswer: 1,
    explanation: '物理层（第1层）负责在物理媒体上传输原始比特流，处理电气、机械、功能和规程特性。',
    category: '网络基础',
    difficulty: 'easy',
    tags: ['OSI模型', '物理层', '信号传输']
  },
  {
    id: 'q92',
    question: 'TCP/IP模型有几层？',
    options: [
      '3层',
      '4层',
      '5层',
      '7层'
    ],
    correctAnswer: 1,
    explanation: 'TCP/IP模型分为4层：应用层、传输层、网络层（互联网层）、网络接口层（数据链路层+物理层）。',
    category: '网络基础',
    difficulty: 'easy',
    tags: ['TCP/IP模型', '网络架构', '分层']
  },
  {
    id: 'q93',
    question: '网络拓扑结构中，总线型拓扑的特点是什么？',
    options: [
      '所有节点连接到中心节点',
      '所有节点连接到一条公共总线',
      '节点间形成环形连接',
      '节点间任意连接'
    ],
    correctAnswer: 1,
    explanation: '总线型拓扑中，所有节点连接到一条公共的传输介质（总线）上，数据在总线上广播传输。',
    category: '网络基础',
    difficulty: 'easy',
    tags: ['网络拓扑', '总线型', '网络结构']
  },
  {
    id: 'q94',
    question: '应用层在OSI模型中的位置和作用是什么？',
    options: [
      '第6层，负责数据格式化',
      '第7层，为用户应用程序提供网络服务',
      '第5层，管理会话',
      '第4层，提供可靠传输'
    ],
    correctAnswer: 1,
    explanation: '应用层是OSI模型的第7层，直接为用户的应用程序提供网络服务接口。',
    category: '网络基础',
    difficulty: 'easy',
    tags: ['OSI模型', '应用层', '网络服务']
  },
  {
    id: 'q95',
    question: '星型拓扑的主要优势是什么？',
    options: [
      '节约电缆',
      '传输距离远',
      '故障隔离能力强',
      '传输速度快'
    ],
    correctAnswer: 2,
    explanation: '星型拓扑的主要优势是故障隔离能力强，单个节点故障不影响其他节点，便于管理和维护。',
    category: '网络基础',
    difficulty: 'medium',
    tags: ['网络拓扑', '星型', '故障隔离']
  },

  // 传输协议类别补充题目 (q96-q110)
  {
    id: 'q96',
    question: 'UDP协议的特点不包括以下哪项？',
    options: [
      '无连接',
      '不可靠传输',
      '自动重传',
      '开销小'
    ],
    correctAnswer: 2,
    explanation: 'UDP是无连接、不可靠的传输协议，不提供自动重传机制，但开销小、速度快。',
    category: '传输协议',
    difficulty: 'easy',
    tags: ['UDP', '无连接', '特点']
  },
  {
    id: 'q97',
    question: 'TCP四次挥手过程中，TIME_WAIT状态的作用是什么？',
    options: [
      '等待更多数据',
      '确保最后的ACK能够到达',
      '节约资源',
      '加快连接释放'
    ],
    correctAnswer: 1,
    explanation: 'TIME_WAIT状态持续2MSL时间，确保最后的ACK报文能够到达对方，并处理可能出现的延迟报文。',
    category: '传输协议',
    difficulty: 'hard',
    tags: ['TCP', '四次挥手', 'TIME_WAIT']
  },
  {
    id: 'q98',
    question: 'TCP拥塞控制算法中，慢启动的特点是什么？',
    options: [
      '拥塞窗口指数增长',
      '拥塞窗口线性增长',
      '拥塞窗口保持不变',
      '拥塞窗口指数减少'
    ],
    correctAnswer: 0,
    explanation: '慢启动阶段，拥塞窗口从1开始，每收到一个ACK就增加1，呈指数增长，直到达到慢启动阈值。',
    category: '传输协议',
    difficulty: 'hard',
    tags: ['TCP', '拥塞控制', '慢启动']
  },
  {
    id: 'q99',
    question: 'TCP序列号的作用是什么？',
    options: [
      '标识连接',
      '确保数据的顺序和完整性',
      '进行流量控制',
      '检测错误'
    ],
    correctAnswer: 1,
    explanation: 'TCP序列号用于标识每个字节的顺序，确保数据能够按正确顺序重组，并检测丢失或重复的数据。',
    category: '传输协议',
    difficulty: 'medium',
    tags: ['TCP', '序列号', '数据完整性']
  },
  {
    id: 'q100',
    question: 'TCP快速重传机制的触发条件是什么？',
    options: [
      '超时',
      '收到3个重复ACK',
      '窗口为0',
      '连接断开'
    ],
    correctAnswer: 1,
    explanation: 'TCP快速重传机制在收到3个重复ACK时触发，不等待超时就立即重传可能丢失的报文段。',
    category: '传输协议',
    difficulty: 'hard',
    tags: ['TCP', '快速重传', '重复ACK']
  },

  // IP地址规划类别补充题目 (q101-q115)
  {
    id: 'q101',
    question: 'IPv4地址分为几类？',
    options: [
      '3类',
      '4类',
      '5类',
      '6类'
    ],
    correctAnswer: 2,
    explanation: 'IPv4地址分为A、B、C、D、E五类，其中A、B、C类用于单播，D类用于组播，E类保留用于研究。',
    category: 'IP地址规划',
    difficulty: 'easy',
    tags: ['IPv4', '地址分类', '单播组播']
  },
  {
    id: 'q102',
    question: 'A类私有地址的范围是什么？',
    options: [
      '10.0.0.0-10.255.255.255',
      '172.16.0.0-172.31.255.255',
      '192.168.0.0-192.168.255.255',
      '127.0.0.0-127.255.255.255'
    ],
    correctAnswer: 0,
    explanation: 'A类私有地址范围是10.0.0.0到10.255.255.255，用于大型内部网络。',
    category: 'IP地址规划',
    difficulty: 'easy',
    tags: ['私有地址', 'A类地址', '内网']
  },
  {
    id: 'q103',
    question: '子网掩码255.255.240.0对应的CIDR表示法是什么？',
    options: [
      '/20',
      '/21',
      '/22',
      '/24'
    ],
    correctAnswer: 0,
    explanation: '255.255.240.0转换为二进制，前20位为1，后12位为0，所以CIDR表示为/20。',
    category: 'IP地址规划',
    difficulty: 'medium',
    tags: ['子网掩码', 'CIDR', '二进制转换']
  },
  {
    id: 'q104',
    question: '广播地址的特点是什么？',
    options: [
      '主机位全为0',
      '主机位全为1',
      '网络位全为0',
      '网络位全为1'
    ],
    correctAnswer: 1,
    explanation: '广播地址是网络中主机位全为1的地址，用于向网络中所有主机发送数据。',
    category: 'IP地址规划',
    difficulty: 'easy',
    tags: ['广播地址', '主机位', '网络通信']
  },
  {
    id: 'q105',
    question: 'VLSM技术的主要优势是什么？',
    options: [
      '简化配置',
      '节约IP地址',
      '提高安全性',
      '增加带宽'
    ],
    correctAnswer: 1,
    explanation: 'VLSM（可变长子网掩码）允许在同一网络中使用不同长度的子网掩码，能够更有效地利用IP地址空间。',
    category: 'IP地址规划',
    difficulty: 'medium',
    tags: ['VLSM', '子网掩码', '地址优化']
  },

  // 交换技术类别补充题目 (q106-q120)
  {
    id: 'q106',
    question: '交换机的MAC地址学习过程是什么？',
    options: [
      '主动查询',
      '静态配置',
      '根据源MAC地址学习',
      '根据目标MAC地址学习'
    ],
    correctAnswer: 2,
    explanation: '交换机通过检查接收到帧的源MAC地址来学习MAC地址表，记录MAC地址与端口的对应关系。',
    category: '交换技术',
    difficulty: 'medium',
    tags: ['交换机', 'MAC学习', '地址表']
  },
  {
    id: 'q107',
    question: 'VLAN间通信需要通过什么设备？',
    options: [
      '交换机',
      '集线器',
      '路由器或三层交换机',
      '网桥'
    ],
    correctAnswer: 2,
    explanation: 'VLAN间通信需要通过工作在第三层的设备，如路由器或三层交换机，因为VLAN隔离了广播域。',
    category: '交换技术',
    difficulty: 'medium',
    tags: ['VLAN', '路由器', '三层交换']
  },
  {
    id: 'q108',
    question: 'Trunk端口的作用是什么？',
    options: [
      '连接终端设备',
      '承载多个VLAN的流量',
      '隔离广播域',
      '提供安全访问'
    ],
    correctAnswer: 1,
    explanation: 'Trunk端口可以承载多个VLAN的流量，通常用于连接交换机之间或交换机与路由器之间。',
    category: '交换技术',
    difficulty: 'medium',
    tags: ['Trunk', 'VLAN', '端口类型']
  },
  {
    id: 'q109',
    question: '生成树协议中，根桥的选择依据是什么？',
    options: [
      '端口数量最多',
      '速度最快',
      'Bridge ID最小',
      'MAC地址最大'
    ],
    correctAnswer: 2,
    explanation: 'STP中根桥的选择基于Bridge ID（桥ID），Bridge ID最小的交换机被选为根桥。',
    category: '交换技术',
    difficulty: 'hard',
    tags: ['STP', '根桥', 'Bridge ID']
  },
  {
    id: 'q110',
    question: '以下哪种情况会导致广播风暴？',
    options: [
      'VLAN配置错误',
      '网络环路',
      'IP地址冲突',
      '端口关闭'
    ],
    correctAnswer: 1,
    explanation: '网络环路会导致广播帧在网络中无限循环，形成广播风暴，这正是STP协议要解决的问题。',
    category: '交换技术',
    difficulty: 'medium',
    tags: ['广播风暴', '网络环路', 'STP']
  },

  // 路由协议类别补充题目 (q111-q125)
  {
    id: 'q111',
    question: 'EIGRP协议属于哪种类型？',
    options: [
      '距离向量协议',
      '链路状态协议',
      '混合协议',
      '路径向量协议'
    ],
    correctAnswer: 2,
    explanation: 'EIGRP是Cisco专有的混合路由协议，结合了距离向量和链路状态协议的特点。',
    category: '路由协议',
    difficulty: 'hard',
    tags: ['EIGRP', '混合协议', 'Cisco']
  },
  {
    id: 'q112',
    question: 'OSPF协议中，DR的作用是什么？',
    options: [
      '计算路由',
      '减少LSA泛洪',
      '负载均衡',
      '错误检测'
    ],
    correctAnswer: 1,
    explanation: 'DR（指定路由器）的主要作用是减少多路访问网络中的LSA泛洪，降低网络开销。',
    category: '路由协议',
    difficulty: 'hard',
    tags: ['OSPF', 'DR', 'LSA']
  },
  {
    id: 'q113',
    question: 'RIPv2相比RIPv1的改进包括什么？',
    options: [
      '支持VLSM',
      '增加跳数限制',
      '改变更新时间',
      '使用TCP传输'
    ],
    correctAnswer: 0,
    explanation: 'RIPv2的主要改进包括支持VLSM、支持认证、发送子网掩码信息等，而RIPv1不支持VLSM。',
    category: '路由协议',
    difficulty: 'medium',
    tags: ['RIPv2', 'VLSM', '协议改进']
  },
  {
    id: 'q114',
    question: 'IS-IS协议工作在OSI模型的哪一层？',
    options: [
      '网络层',
      '数据链路层',
      '传输层',
      '应用层'
    ],
    correctAnswer: 1,
    explanation: 'IS-IS协议直接工作在数据链路层之上，不需要IP协议支持，这是它与OSPF的一个重要区别。',
    category: '路由协议',
    difficulty: 'hard',
    tags: ['IS-IS', '数据链路层', 'OSI模型']
  },
  {
    id: 'q115',
    question: '静态路由的优点是什么？',
    options: [
      '自动更新',
      '配置简单且安全',
      '适应网络变化',
      '开销大'
    ],
    correctAnswer: 1,
    explanation: '静态路由配置简单，不会自动变化，安全性高，但需要手动维护，不能自动适应网络拓扑变化。',
    category: '路由协议',
    difficulty: 'easy',
    tags: ['静态路由', '配置', '安全性']
  },

  // 网络安全类别补充题目 (q116-q130)
  {
    id: 'q116',
    question: 'IDS和IPS的主要区别是什么？',
    options: [
      '检测速度不同',
      'IDS只检测，IPS能阻断',
      '部署位置不同',
      '价格不同'
    ],
    correctAnswer: 1,
    explanation: 'IDS（入侵检测系统）只能检测和报警，而IPS（入侵防护系统）既能检测又能主动阻断攻击。',
    category: '网络安全',
    difficulty: 'medium',
    tags: ['IDS', 'IPS', '入侵检测']
  },
  {
    id: 'q117',
    question: 'DDoS攻击的特点是什么？',
    options: [
      '单点攻击',
      '分布式拒绝服务攻击',
      '数据窃取',
      '权限提升'
    ],
    correctAnswer: 1,
    explanation: 'DDoS（分布式拒绝服务攻击）利用多个攻击源同时向目标发起攻击，使其无法正常提供服务。',
    category: '网络安全',
    difficulty: 'medium',
    tags: ['DDoS', '分布式攻击', '拒绝服务']
  },
  {
    id: 'q118',
    question: 'ARP欺骗攻击的原理是什么？',
    options: [
      '伪造IP地址',
      '伪造MAC地址与IP地址的对应关系',
      '伪造端口号',
      '伪造协议头'
    ],
    correctAnswer: 1,
    explanation: 'ARP欺骗通过发送虚假的ARP响应，使受害者的ARP表中记录错误的MAC-IP对应关系，从而劫持流量。',
    category: '网络安全',
    difficulty: 'medium',
    tags: ['ARP欺骗', 'MAC地址', '中间人攻击']
  },
  {
    id: 'q119',
    question: '数字证书的主要作用是什么？',
    options: [
      '数据压缩',
      '身份认证和数据完整性验证',
      '提高传输速度',
      '节约带宽'
    ],
    correctAnswer: 1,
    explanation: '数字证书用于验证实体身份的真实性，确保数据的完整性和不可否认性，是PKI体系的重要组成部分。',
    category: '网络安全',
    difficulty: 'medium',
    tags: ['数字证书', 'PKI', '身份认证']
  },
  {
    id: 'q120',
    question: '对称加密和非对称加密的主要区别是什么？',
    options: [
      '加密强度不同',
      '密钥管理方式不同',
      '算法复杂度相同',
      '应用场景相同'
    ],
    correctAnswer: 1,
    explanation: '对称加密使用相同密钥加解密，速度快但密钥分发困难；非对称加密使用公私钥对，安全但速度慢。',
    category: '网络安全',
    difficulty: 'medium',
    tags: ['对称加密', '非对称加密', '密钥管理']
  },

  // 应用层协议类别补充题目 (q121-q135)
  {
    id: 'q121',
    question: 'HTTP和HTTPS的主要区别是什么？',
    options: [
      '端口号不同',
      'HTTPS增加了SSL/TLS加密',
      '传输速度不同',
      '支持的方法不同'
    ],
    correctAnswer: 1,
    explanation: 'HTTPS在HTTP基础上增加了SSL/TLS加密层，提供数据加密、身份认证和数据完整性保护。',
    category: '应用层协议',
    difficulty: 'easy',
    tags: ['HTTP', 'HTTPS', 'SSL/TLS']
  },
  {
    id: 'q122',
    question: 'SMTP协议的默认端口号是什么？',
    options: [
      '21',
      '23',
      '25',
      '53'
    ],
    correctAnswer: 2,
    explanation: 'SMTP（简单邮件传输协议）使用TCP端口25进行邮件传输，SMTPS使用端口465或587。',
    category: '应用层协议',
    difficulty: 'easy',
    tags: ['SMTP', '邮件协议', '端口25']
  },
  {
    id: 'q123',
    question: 'FTP协议使用几个端口？',
    options: [
      '1个',
      '2个',
      '3个',
      '4个'
    ],
    correctAnswer: 1,
    explanation: 'FTP使用两个端口：21端口用于控制连接，20端口用于数据传输（主动模式）。',
    category: '应用层协议',
    difficulty: 'medium',
    tags: ['FTP', '双端口', '控制连接']
  },
  {
    id: 'q124',
    question: 'Telnet协议的安全问题是什么？',
    options: [
      '速度慢',
      '明文传输',
      '端口冲突',
      '协议复杂'
    ],
    correctAnswer: 1,
    explanation: 'Telnet协议以明文方式传输所有数据包括密码，存在严重安全隐患，现在多用SSH替代。',
    category: '应用层协议',
    difficulty: 'easy',
    tags: ['Telnet', '明文传输', '安全隐患']
  },
  {
    id: 'q125',
    question: 'POP3和IMAP协议的主要区别是什么？',
    options: [
      '端口号不同',
      'POP3下载后删除，IMAP支持服务器存储',
      '加密方式不同',
      '传输速度不同'
    ],
    correctAnswer: 1,
    explanation: 'POP3将邮件下载到本地后从服务器删除，IMAP支持在服务器上管理邮件，支持多设备同步。',
    category: '应用层协议',
    difficulty: 'medium',
    tags: ['POP3', 'IMAP', '邮件管理']
  },

  // 以太网技术类别补充题目 (q126-q140)
  {
    id: 'q126',
    question: '以太网帧中，前导码的长度是多少字节？',
    options: [
      '6字节',
      '7字节',
      '8字节',
      '12字节'
    ],
    correctAnswer: 2,
    explanation: '以太网帧前导码长度为8字节，包括7字节前导码和1字节帧起始定界符（SFD）。',
    category: '以太网技术',
    difficulty: 'medium',
    tags: ['以太网帧', '前导码', 'SFD']
  },
  {
    id: 'q127',
    question: '快速以太网的传输速率是多少？',
    options: [
      '10 Mbps',
      '100 Mbps',
      '1000 Mbps',
      '10000 Mbps'
    ],
    correctAnswer: 1,
    explanation: '快速以太网（Fast Ethernet）的传输速率为100 Mbps，对应IEEE 802.3u标准。',
    category: '以太网技术',
    difficulty: 'easy',
    tags: ['快速以太网', '100M', 'IEEE 802.3u']
  },
  {
    id: 'q128',
    question: '100BASE-FX使用什么传输介质？',
    options: [
      '双绞线',
      '同轴电缆',
      '光纤',
      '无线'
    ],
    correctAnswer: 2,
    explanation: '100BASE-FX使用多模光纤作为传输介质，传输距离可达2公里。',
    category: '以太网技术',
    difficulty: 'easy',
    tags: ['100BASE-FX', '光纤', '多模']
  },
  {
    id: 'q129',
    question: '以太网中，碰撞域的概念是什么？',
    options: [
      '网络中的广播范围',
      '可能发生冲突的网络区域',
      'VLAN的范围',
      '路由的范围'
    ],
    correctAnswer: 1,
    explanation: '碰撞域是指网络中可能发生数据碰撞的区域，交换机的每个端口都是独立的碰撞域。',
    category: '以太网技术',
    difficulty: 'medium',
    tags: ['碰撞域', '数据冲突', '交换机']
  },
  {
    id: 'q130',
    question: '万兆以太网对应的IEEE标准是什么？',
    options: [
      'IEEE 802.3',
      'IEEE 802.3u',
      'IEEE 802.3z',
      'IEEE 802.3ae'
    ],
    correctAnswer: 3,
    explanation: '万兆以太网（10 Gigabit Ethernet）对应IEEE 802.3ae标准，传输速率为10 Gbps。',
    category: '以太网技术',
    difficulty: 'medium',
    tags: ['万兆以太网', 'IEEE 802.3ae', '10G']
  },

  // 数据链路层类别补充题目 (q131-q145)
  {
    id: 'q131',
    question: 'HDLC协议的帧格式中，标志字段的值是什么？',
    options: [
      '01111110',
      '11111111',
      '00000000',
      '10101010'
    ],
    correctAnswer: 0,
    explanation: 'HDLC协议使用01111110作为帧的起始和结束标志，并使用位填充技术防止数据中出现标志序列。',
    category: '数据链路层',
    difficulty: 'medium',
    tags: ['HDLC', '帧格式', '标志字段']
  },
  {
    id: 'q132',
    question: 'CRC校验的主要作用是什么？',
    options: [
      '数据压缩',
      '错误检测',
      '数据加密',
      '流量控制'
    ],
    correctAnswer: 1,
    explanation: 'CRC（循环冗余校验）是一种错误检测技术，能够检测传输过程中发生的数据错误。',
    category: '数据链路层',
    difficulty: 'easy',
    tags: ['CRC', '错误检测', '校验']
  },
  {
    id: 'q133',
    question: 'Stop-and-Wait协议的特点是什么？',
    options: [
      '并行传输多个帧',
      '发送一帧等待确认后再发送下一帧',
      '不需要确认',
      '只能传输固定大小的帧'
    ],
    correctAnswer: 1,
    explanation: 'Stop-and-Wait（停等协议）每次只发送一个帧，必须等待接收方的确认后才能发送下一个帧。',
    category: '数据链路层',
    difficulty: 'medium',
    tags: ['停等协议', 'ARQ', '确认机制']
  },
  {
    id: 'q134',
    question: '数据链路层的滑动窗口协议主要解决什么问题？',
    options: [
      '错误检测',
      '提高信道利用率',
      '数据加密',
      '路径选择'
    ],
    correctAnswer: 1,
    explanation: '滑动窗口协议允许发送方连续发送多个帧而不必等待确认，大大提高了信道利用率。',
    category: '数据链路层',
    difficulty: 'medium',
    tags: ['滑动窗口', '信道利用率', '流水线']
  },
  {
    id: 'q135',
    question: 'LLC子层的主要功能是什么？',
    options: [
      '物理信号传输',
      '提供统一的数据链路层接口',
      '路径选择',
      '错误纠正'
    ],
    correctAnswer: 1,
    explanation: 'LLC（逻辑链路控制）子层为上层提供统一的接口，屏蔽不同MAC子层的差异。',
    category: '数据链路层',
    difficulty: 'medium',
    tags: ['LLC', '逻辑链路控制', '接口统一']
  },

  // 物理层技术类别补充题目 (q136-q150)
  {
    id: 'q136',
    question: '光纤通信的主要优势是什么？',
    options: [
      '成本低',
      '抗电磁干扰强',
      '安装简单',
      '功耗低'
    ],
    correctAnswer: 1,
    explanation: '光纤通信的主要优势包括传输距离远、带宽大、抗电磁干扰强、保密性好等特点。',
    category: '物理层技术',
    difficulty: 'easy',
    tags: ['光纤', '抗干扰', '传输优势']
  },
  {
    id: 'q137',
    question: '5类双绞线的传输带宽是多少？',
    options: [
      '10 MHz',
      '16 MHz',
      '100 MHz',
      '250 MHz'
    ],
    correctAnswer: 2,
    explanation: '5类双绞线的传输带宽为100 MHz，支持100 Mbps的快速以太网传输。',
    category: '物理层技术',
    difficulty: 'medium',
    tags: ['5类双绞线', '100MHz', '带宽']
  },
  {
    id: 'q138',
    question: '同轴电缆的阻抗通常是多少欧姆？',
    options: [
      '50欧姆或75欧姆',
      '100欧姆',
      '120欧姆',
      '600欧姆'
    ],
    correctAnswer: 0,
    explanation: '同轴电缆的特性阻抗通常为50欧姆（用于数据通信）或75欧姆（用于视频传输）。',
    category: '物理层技术',
    difficulty: 'medium',
    tags: ['同轴电缆', '阻抗', '50/75欧姆']
  },
  {
    id: 'q139',
    question: '曼彻斯特编码的特点是什么？',
    options: [
      '编码效率高',
      '每个码元中间有跳变',
      '不需要同步',
      '抗干扰能力弱'
    ],
    correctAnswer: 1,
    explanation: '曼彻斯特编码每个码元的中间都有电平跳变，提供了自同步能力，但编码效率只有50%。',
    category: '物理层技术',
    difficulty: 'medium',
    tags: ['曼彻斯特编码', '自同步', '电平跳变']
  },
  {
    id: 'q140',
    question: '信噪比SNR的单位是什么？',
    options: [
      '赫兹(Hz)',
      '分贝(dB)',
      '比特(bit)',
      '瓦特(W)'
    ],
    correctAnswer: 1,
    explanation: '信噪比通常用分贝(dB)表示，计算公式为SNR(dB) = 10 × log10(信号功率/噪声功率)。',
    category: '物理层技术',
    difficulty: 'easy',
    tags: ['信噪比', '分贝', 'SNR']
  },

  // 网络设备类别补充题目 (q141-q155)
  {
    id: 'q141',
    question: '集线器工作在OSI模型的哪一层？',
    options: [
      '物理层',
      '数据链路层',
      '网络层',
      '传输层'
    ],
    correctAnswer: 0,
    explanation: '集线器（Hub）工作在物理层，只是简单的信号放大和转发设备，所有端口共享带宽。',
    category: '网络设备',
    difficulty: 'easy',
    tags: ['集线器', '物理层', '信号放大']
  },
  {
    id: 'q142',
    question: '三层交换机相比二层交换机的主要优势是什么？',
    options: [
      '价格便宜',
      '支持路由功能',
      '端口数量多',
      '功耗低'
    ],
    correctAnswer: 1,
    explanation: '三层交换机在二层交换功能基础上增加了路由功能，可以进行VLAN间路由和IP路由。',
    category: '网络设备',
    difficulty: 'medium',
    tags: ['三层交换机', '路由功能', 'VLAN间路由']
  },
  {
    id: 'q143',
    question: '路由器和交换机的主要区别是什么？',
    options: [
      '端口数量不同',
      '工作层次不同',
      '传输速度不同',
      '功耗不同'
    ],
    correctAnswer: 1,
    explanation: '路由器工作在网络层，进行IP路由；交换机工作在数据链路层，进行MAC地址转发。',
    category: '网络设备',
    difficulty: 'easy',
    tags: ['路由器', '交换机', '工作层次']
  },
  {
    id: 'q144',
    question: '负载均衡器的主要作用是什么？',
    options: [
      '提高安全性',
      '分散服务器负载',
      '加密数据',
      '压缩数据'
    ],
    correctAnswer: 1,
    explanation: '负载均衡器将网络流量分散到多个服务器上，提高系统的可用性和性能。',
    category: '网络设备',
    difficulty: 'medium',
    tags: ['负载均衡器', '流量分散', '高可用']
  },
  {
    id: 'q145',
    question: '网关的主要功能是什么？',
    options: [
      '信号放大',
      '协议转换和网络互连',
      '数据加密',
      '流量监控'
    ],
    correctAnswer: 1,
    explanation: '网关主要用于不同协议网络之间的互连，可以进行协议转换和数据格式转换。',
    category: '网络设备',
    difficulty: 'medium',
    tags: ['网关', '协议转换', '网络互连']
  },

  // 网络服务类别补充题目 (q146-q160)
  {
    id: 'q146',
    question: 'DHCP中继代理的作用是什么？',
    options: [
      '分配IP地址',
      '转发DHCP请求到其他网段的DHCP服务器',
      '验证客户端身份',
      '管理IP地址池'
    ],
    correctAnswer: 1,
    explanation: 'DHCP中继代理使得不同网段的客户端可以从远程DHCP服务器获取IP地址配置。',
    category: '网络服务',
    difficulty: 'medium',
    tags: ['DHCP中继', '跨网段', 'IP分配']
  },
  {
    id: 'q147',
    question: 'DNS的递归查询和迭代查询的区别是什么？',
    options: [
      '查询速度不同',
      '递归查询由DNS服务器代为查询，迭代查询需客户端自己查询',
      '查询结果不同',
      '使用的协议不同'
    ],
    correctAnswer: 1,
    explanation: '递归查询时DNS服务器代为完成整个查询过程；迭代查询时DNS服务器只返回下一步查询的地址。',
    category: '网络服务',
    difficulty: 'medium',
    tags: ['DNS', '递归查询', '迭代查询']
  },
  {
    id: 'q148',
    question: 'NTP协议的主要作用是什么？',
    options: [
      '文件传输',
      '时间同步',
      '邮件传输',
      '域名解析'
    ],
    correctAnswer: 1,
    explanation: 'NTP（网络时间协议）用于在网络中同步计算机的时钟，确保网络中所有设备的时间一致。',
    category: '网络服务',
    difficulty: 'easy',
    tags: ['NTP', '时间同步', '网络时钟']
  },
  {
    id: 'q149',
    question: 'Proxy服务器的主要功能是什么？',
    options: [
      '路由转发',
      '代理上网和缓存',
      '加密传输',
      '负载均衡'
    ],
    correctAnswer: 1,
    explanation: 'Proxy（代理）服务器代替客户端访问外部网络，可以提供缓存、访问控制、日志记录等功能。',
    category: '网络服务',
    difficulty: 'easy',
    tags: ['代理服务器', '缓存', '访问控制']
  },
  {
    id: 'q150',
    question: 'RADIUS协议主要用于什么？',
    options: [
      '路由协议',
      '认证、授权和计费',
      '文件传输',
      '时间同步'
    ],
    correctAnswer: 1,
    explanation: 'RADIUS（远程用户拨入认证服务）协议主要用于网络访问的认证、授权和计费（AAA）。',
    category: '网络服务',
    difficulty: 'medium',
    tags: ['RADIUS', 'AAA', '认证授权']
  },

  // 网络技术类别补充题目 (q151-q165)
  {
    id: 'q151',
    question: 'SDN的核心思想是什么？',
    options: [
      '提高网络速度',
      '控制平面与数据平面分离',
      '增加网络安全',
      '降低网络成本'
    ],
    correctAnswer: 1,
    explanation: 'SDN（软件定义网络）的核心思想是将网络控制平面与数据平面分离，实现网络的集中控制和灵活配置。',
    category: '网络技术',
    difficulty: 'hard',
    tags: ['SDN', '控制平面', '数据平面']
  },
  {
    id: 'q152',
    question: 'QoS技术的主要目的是什么？',
    options: [
      '提高网络安全',
      '保证网络服务质量',
      '增加网络容量',
      '简化网络管理'
    ],
    correctAnswer: 1,
    explanation: 'QoS（服务质量）技术通过流量分类、优先级控制等手段，保证关键业务的网络服务质量。',
    category: '网络技术',
    difficulty: 'medium',
    tags: ['QoS', '服务质量', '流量控制']
  },
  {
    id: 'q153',
    question: '云计算中，IaaS的含义是什么？',
    options: [
      '基础设施即服务',
      '平台即服务',
      '软件即服务',
      '网络即服务'
    ],
    correctAnswer: 0,
    explanation: 'IaaS（Infrastructure as a Service）是基础设施即服务，提供虚拟化的计算资源。',
    category: '网络技术',
    difficulty: 'medium',
    tags: ['云计算', 'IaaS', '基础设施服务']
  },
  {
    id: 'q154',
    question: 'VXLAN技术的主要作用是什么？',
    options: [
      '提高传输速度',
      '扩展VLAN数量限制',
      '加密数据传输',
      '负载均衡'
    ],
    correctAnswer: 1,
    explanation: 'VXLAN通过在UDP隧道中封装二层帧，突破了传统VLAN 4096个的数量限制，支持1600万个租户网络。',
    category: '网络技术',
    difficulty: 'hard',
    tags: ['VXLAN', 'VLAN扩展', '隧道技术']
  },
  {
    id: 'q155',
    question: 'P2P网络的特点是什么？',
    options: [
      '集中式管理',
      '每个节点既是客户端又是服务器',
      '需要专门的服务器',
      '单向通信'
    ],
    correctAnswer: 1,
    explanation: 'P2P（点对点）网络中每个节点都具有相同的地位，既可以提供服务也可以使用服务。',
    category: '网络技术',
    difficulty: 'easy',
    tags: ['P2P', '对等网络', '分布式']
  },

  // 网络管理类别补充题目 (q156-q170)
  {
    id: 'q156',
    question: 'SNMP中，Trap消息的特点是什么？',
    options: [
      '需要响应确认',
      '由网络设备主动发送',
      '只能查询不能设置',
      '使用TCP传输'
    ],
    correctAnswer: 1,
    explanation: 'SNMP Trap是由网络设备主动发送给管理站的通知消息，用于报告重要事件或状态变化。',
    category: '网络管理',
    difficulty: 'medium',
    tags: ['SNMP', 'Trap', '主动通知']
  },
  {
    id: 'q157',
    question: 'MIB的全称是什么？',
    options: [
      'Management Information Base',
      'Multiple Interface Bridge',
      'Media Independent Block',
      'Memory Interface Buffer'
    ],
    correctAnswer: 0,
    explanation: 'MIB（Management Information Base）是管理信息库，定义了网络设备中可管理对象的结构。',
    category: '网络管理',
    difficulty: 'medium',
    tags: ['MIB', '管理信息库', 'SNMP']
  },
  {
    id: 'q158',
    question: '网络性能监控中，带宽利用率的合理范围是多少？',
    options: [
      '0-30%',
      '30-70%',
      '70-90%',
      '90-100%'
    ],
    correctAnswer: 1,
    explanation: '正常情况下网络带宽利用率应保持在30-70%之间，过低浪费资源，过高影响性能。',
    category: '网络管理',
    difficulty: 'medium',
    tags: ['带宽利用率', '性能监控', '网络优化']
  },
  {
    id: 'q159',
    question: 'Syslog的主要作用是什么？',
    options: [
      '网络配置',
      '日志管理和事件记录',
      '性能监控',
      '安全认证'
    ],
    correctAnswer: 1,
    explanation: 'Syslog是一种标准的日志协议，用于在网络中传输和管理系统日志信息。',
    category: '网络管理',
    difficulty: 'easy',
    tags: ['Syslog', '日志管理', '事件记录']
  },
  {
    id: 'q160',
    question: '网络故障诊断中，ping命令主要测试什么？',
    options: [
      '带宽大小',
      '网络连通性',
      '路由路径',
      'DNS解析'
    ],
    correctAnswer: 1,
    explanation: 'ping命令通过发送ICMP回显请求测试网络连通性和基本的往返时间。',
    category: '网络管理',
    difficulty: 'easy',
    tags: ['ping', 'ICMP', '连通性测试']
  },
  {
    id: 'q161',
    question: 'SNMP Get和Set操作的区别是什么？',
    options: [
      'Get用于读取，Set用于修改',
      'Get速度更快',
      'Set更安全',
      '没有区别'
    ],
    correctAnswer: 0,
    explanation: 'SNMP Get操作用于读取管理对象的值，Set操作用于修改管理对象的值。',
    category: '网络管理',
    difficulty: 'easy',
    tags: ['SNMP', 'Get/Set', '管理操作']
  },
  {
    id: 'q162',
    question: '网络管理的基本功能不包括以下哪项？',
    options: [
      '配置管理',
      '故障管理',
      '性能管理',
      '数据加密'
    ],
    correctAnswer: 3,
    explanation: '网络管理的基本功能包括配置管理、故障管理、性能管理、安全管理和计费管理，数据加密属于安全管理的具体实现。',
    category: '网络管理',
    difficulty: 'medium',
    tags: ['网络管理', '基本功能', 'FCAPS']
  },
  {
    id: 'q163',
    question: 'Network Topology Discovery主要使用哪种协议？',
    options: [
      'SNMP',
      'CDP/LLDP',
      'OSPF',
      'BGP'
    ],
    correctAnswer: 1,
    explanation: 'CDP（Cisco Discovery Protocol）和LLDP（Link Layer Discovery Protocol）主要用于网络拓扑发现。',
    category: '网络管理',
    difficulty: 'medium',
    tags: ['拓扑发现', 'CDP', 'LLDP']
  },
  {
    id: 'q164',
    question: 'RMON的全称是什么？',
    options: [
      'Remote Monitoring',
      'Real-time Monitoring',
      'Router Monitoring',
      'Resource Monitoring'
    ],
    correctAnswer: 0,
    explanation: 'RMON（Remote Monitoring）是远程监控的缩写，是SNMP的扩展，用于远程网络监控。',
    category: '网络管理',
    difficulty: 'medium',
    tags: ['RMON', '远程监控', 'SNMP扩展']
  },
  {
    id: 'q165',
    question: '网络管理系统中的阈值告警机制主要作用是什么？',
    options: [
      '提高网络速度',
      '及时发现网络异常',
      '减少网络成本',
      '增强网络安全'
    ],
    correctAnswer: 1,
    explanation: '阈值告警机制通过设定参数上下限，当网络指标超出正常范围时及时发出告警，帮助管理员发现网络异常。',
    category: '网络管理',
    difficulty: 'easy',
    tags: ['阈值告警', '异常检测', '监控机制']
  },

  // IPv6技术类别补充题目 (q166-q180)
  {
    id: 'q161',
    question: 'IPv6地址的表示方法中，::表示什么？',
    options: [
      '本地地址',
      '连续的0组压缩表示',
      '广播地址',
      '组播地址'
    ],
    correctAnswer: 1,
    explanation: 'IPv6中的::表示连续的零组压缩，一个地址中只能使用一次，用于简化地址表示。',
    category: 'IPv6技术',
    difficulty: 'medium',
    tags: ['IPv6', '地址压缩', '零组压缩']
  },
  {
    id: 'q162',
    question: 'IPv6的单播地址类型不包括以下哪种？',
    options: [
      '全球单播地址',
      '链路本地地址',
      '站点本地地址',
      '广播地址'
    ],
    correctAnswer: 3,
    explanation: 'IPv6没有广播地址，使用组播地址代替广播功能。IPv6的单播地址包括全球单播、链路本地、站点本地等。',
    category: 'IPv6技术',
    difficulty: 'medium',
    tags: ['IPv6', '单播地址', '地址类型']
  },
  {
    id: 'q163',
    question: 'IPv6的自动配置机制称为什么？',
    options: [
      'DHCP',
      'SLAAC',
      'NAT',
      'DNS'
    ],
    correctAnswer: 1,
    explanation: 'SLAAC（Stateless Address Autoconfiguration）是IPv6的无状态地址自动配置机制。',
    category: 'IPv6技术',
    difficulty: 'hard',
    tags: ['IPv6', 'SLAAC', '自动配置']
  },
  {
    id: 'q164',
    question: 'IPv6中的ICMPv6相比ICMPv4增加了什么功能？',
    options: [
      '错误检测',
      '邻居发现',
      '路径MTU发现',
      '时间戳'
    ],
    correctAnswer: 1,
    explanation: 'ICMPv6在ICMPv4基础上增加了邻居发现协议（NDP）功能，用于地址解析和重复地址检测。',
    category: 'IPv6技术',
    difficulty: 'hard',
    tags: ['ICMPv6', '邻居发现', 'NDP']
  },
  {
    id: 'q165',
    question: 'IPv6过渡技术中，双栈技术的特点是什么？',
    options: [
      '只支持IPv4',
      '只支持IPv6',
      '同时支持IPv4和IPv6',
      '自动转换协议'
    ],
    correctAnswer: 2,
    explanation: '双栈技术使设备同时运行IPv4和IPv6协议栈，可以与两种协议的网络通信。',
    category: 'IPv6技术',
    difficulty: 'medium',
    tags: ['IPv6过渡', '双栈技术', '协议兼容']
  }
];

export const categories = [
  '网络基础',
  '传输协议', 
  'IP地址规划',
  '交换技术',
  '路由协议',
  '网络安全',
  '以太网技术',
  '应用层协议',
  'IPv6技术',
  '网络设备',
  '数据链路层',
  '网络服务',
  '物理层技术',
  '网络技术',
  '网络管理'
];