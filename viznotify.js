// --------- Настройки скрипта -----------------
var height = null
var retro = 0*(60*60)/3 // hour
var startBlock = 0
var stopBlock = 6926090
var timepass=0
//var opPrev = null

// --------- Настройки программы -----------------
const TelegramBot = require('node-telegram-bot-api'); // Тем самым подключаем api 
const viz = require("viz-js-lib")

var fs = require ("fs")
var request = require('request');
const _ = require('lodash')

var postInfo = null

var messageChatId = null
var messageUser = null
var messageText = null
let lst = fs.readFileSync("users.lst", "utf8")
var allusers=lst.split("\n")
console.log("Users:", allusers.length-1)

var arrOp=[]
var arrTitle=[]
lst=fs.readFileSync("opTitle.lst", "utf8")
var alltitle=lst.split("\n")
for (let i=0; i<alltitle.length;i++) {
    lst=alltitle[i].split("|")
    arrOp[i]=lst[0]
    arrTitle[i]=lst[1]
}
var opts = { disable_web_page_preview: true, parse_mode: 'markdown' }

//console.log(arrTitle)
// --------- Настройки ноды -----------------
const VIZNODE = "ws://192.168.1.220:8191"
//const VIZNODE = "wss://ws.viz.io"
//const VIZNODE = fs.readFileSync("/mnt/node.act", "utf8")

viz.config.set('websocket', VIZNODE)
// @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@


// Init API TELEGRAM
const TOKEN="000000000:0000000000000000000000000000" // @bot
var botOptions = { polling: true }; 
var bot = new TelegramBot(TOKEN, botOptions); // Создаём экземпляр объекта бота через конструктор, 
// если по простому, то мы будем обращаться к bot за нашими методами api.


// --------- Набор функций :-) -----------------

    bot.on('text', function(msg) {
	// msg - Объект, который возвращает этот метод, 
	//    когда приходит сообщение, посмотрите через консоль из чего он состоит. 
	//    Далее получим id чата, чтобы разделять написавших и само сообщение     
	messageChatId = msg.chat.id;
	messageText = msg.text.trim();

	if (msg.chat.first_name!==undefined) {
	    messageUser = msg.chat.first_name
	}
	if (msg.chat.last_name!==undefined) {
	    messageUser+=" "+msg.chat.last_name
	}
	if (messageUser=="") {
	    messageUser = msg.chat.username
	}

	if (messageText == '/start') {
         // /start это первая команда, которая посылается любому боту
	    botUsers(messageChatId, "add")
 // метод, посылающий сообщение в чат, первым аргументом тот самый id, вторым - сообщение, 
 // есть и третий, но о нём в следующем уроке, если вы поддержите статью.
	    return
	}
	if (messageText == '/stop') {
         // /stop - удалить юзера из рассылки
	    botUsers(messageChatId, "del")
	    return
	}
	if (messageText == '-') {
         // удаление подписки юзера
	    fs.unlinkSync("users/"+messageChatId+".cfg")
	    console.log("Del filter", messageChatId)
	    bot.sendMessage(messageChatId, "ߑϠФильтр удалён")
	    return
	}
	if (messageText == '/list') {
         // список операций
	    let lst=""
	    let arr=[]
	    for (i=0; i<alltitle.length; i++) {
		lst=alltitle[i].split("|")
		arr[i]=lst[1]
	    }
	    arr.sort()
	    lst=""
	    for (i=0; i<arr.length; i++) {
		lst+="▫ "+arr[i]+"\n"
	    }
	    bot.sendMessage(messageChatId, "v.0.7 | ߓàСписок операций\n\n"+lst)
	    return
	}
	if (messageText == '/filter') {
	    fs.access("users/"+messageChatId+".cfg", function(err) {
		if (err) {
		    bot.sendMessage(messageChatId, "ߑʠФильтр не установлен")
		    console.log("Нет", "users/"+messageChatId+".cfg")
		} else {
		    let lst = fs.readFileSync("users/"+messageChatId+".cfg", "utf8")
		    if (lst=="") {
			console.log("not Set", lst)
			bot.sendMessage(messageChatId, "ߑʠФильтр не установлен")
		    } else {
			console.log("now Set", lst)
			bot.sendMessage(messageChatId, "ߑʠУстановлен фильтр:\n"+lst)
		    }
		}
	    });
	    bot.sendMessage(messageChatId, 'Вы можете указать один или несколько аккаунтов (через запятую без @), за которыми желаете наблюдать.\nПовторный ввод заменит предыдущий.\nЗнак `+` в начале строки добавит фильтр.\nЗнак `-` удалит фильтр полностью.', opts)
	    return
	}
	botUsers(messageChatId, "set", messageText)
});

const botUsers = (user, oper, data) => {
//    let lst = fs.readFileSync("users.lst", "utf8")
//    let arr = lst.split("\n")
    let arr = allusers
    let numb = userNumb(arr, user)

    if (numb>=0 ) {
	if(oper=="del") {
	    arr.splice(numb,1);
	    let users=""
	    for (let i=0; i<arr.length; i++) {
		if (arr[i]!="") {
		    users+=arr[i]+"\n"
		}
	    }
	    fs.writeFileSync("users.lst", users.trim(), 'utf-8')
	    allusers=arr
	    console.log("Del", user, "users/"+user+".cfg")
	    fs.unlinkSync("users/"+user+".cfg")
	    bot.sendMessage(user, 'ߙˠВас удалили или Good Bye');
	    return
	}
	if (oper == "set") {
	    if (data[0] == '+') {
		data=data.substr(1)
            // если добавление к подписке - проверяем наличие файла
		if (checkPermissions("users/"+user+".cfg")) {
		    let lst = fs.readFileSync("users/"+user+".cfg", "utf8")
		    data=lst+","+data
		    bot.sendMessage(user, "ߑʠФильтр установлен, обновляем")
		} else {
		// если нет
		    bot.sendMessage(user, "ߑʠФильтр не установлен, создаём")
		}
	    }
	    console.log("Set", user, data)
	    fs.writeFileSync("users/"+user+".cfg", data)
	    bot.sendMessage(user, 'ߑʠФильтр установлен:\n'+data);
	return
	}
	bot.sendMessage(user, 'Пользователь уже зарегистрирован.\n Отменить подписку: /stop');
    } else {
	if (oper == "add") {
	    if (user<0) {
		console.log("Group no!", user)
		bot.sendMessage(user, 'Бот в группу не подключается.\nChao!');
		return
	    }
	    console.log("Add", user)
	    fs.appendFileSync("users.lst", "\n"+user)
	    allusers.push(user)
	    fs.writeFileSync("users/"+user+".cfg", "")
	    bot.sendMessage(user, 'ߎɠДобро пожаловать или Hello, '+messageUser+"!");
	    return
	}
	bot.sendMessage(user, "Пользователь не определён. Используйте /start")
    }
}

function userNumb (arr, user) {
    console.log(user)
    for (let i=0; i<arr.length; i++) {
	if (arr[i]==user) {
	    return i
	}
    }
    return -1
}

const checkPermissions = file => {
  try {
    fs.accessSync(file, fs.constants.R_OK);
    //console.log('can read/write');
    return true;
  } catch (err) {
    console.error('is not readable is readable________________');
    return false;
  }
};

const date = () => {
    console.log(Date.now())
}

// Получаем состояние блокчейна
const getBlockchainState = (result) => {
    return new Promise((resolve, reject) => {
        // console.log("GetBlockChainState ", resolve)
        viz.api.getDynamicGlobalProperties((err, result) => {
            if (err) {
                reject(err)
            }
            else {
                // console.log("resolve ", result);
                resolve(result)
            }
        })
    })
}

//Получаем номер свежего блока
const pluckBlockHeight = x =>{
    heightS = x.head_block_number
    height = heightS - retro
    if (startBlock>0) {
	height = startBlock
    }
}

const processBlockData = () => {
//     console.log("Process block")
    viz.api.getBlock(height, (err, result) => { // Получаем блок данных каждые три секунды
        if (err) {
	    timepass+=3
            console.log("no getBlock: ", timepass)
        }
        else {
if (retro>0) {
//	     console.log(`\x1b[32m === БЛОК === ${height}\x1b[0m`)
}
            if(result != null){
                unnestOps(result).forEach(selectOpHandler) // дербаним блок по операциям
                height += 1 // следующий блок
//		console.log("BLOCK", height)
		if ( (retro > 0 && (height >= heightS+retro/100)) || height==stopBlock) {
		    process.exit(0)
		}
            }
        }
    })
}

// Достаем из блока набор данных
const unnestOps = (blockData) => {
    // метод map создает новый array применяя функцию переданную в первый аргумент
    // к каждому элементу используем метод flatten модуля lodash для извлечения
    // элементов из вложенных списков и помещения в одноуровневый список
    try {
        return _.flatten(blockData.transactions.map(tx => tx.operations))
    } catch (err) {
        console.log("vizapi:", "=== No good block !!! ===")
        console.log("vizapi:", err)
        return (["0"])
    }
}

/// Получаем блок и отправляем на обработку в функцию
const selectOpHandler = (op) => {

    if (op[0] == "0") {
        console.log("vizapi: ", "No good opData handled");
        return;
    }
    const [opType, opData] = op

    let lst = fs.readFileSync("opType.lst", "utf8")
    let arr = lst.split("\n")
    let type = opType

    if (opType == "custom") {
        type = opType+"."+opData.id
    }
	console.log(type, height-1)

    if (arr.includes(type)) {
	console.log(JSON.stringify(opData, null, 2))
    } else {
	console.log(type)
	console.log(op)
    }
    makeMessage(type, opData)
}

const getTitle = (op) => {
    for (let i=0; i<arrTitle.length;i++) {
	if (arrOp[i].trim()==op) {
	    console.log(arrOp[i], arrTitle[i])
	    return arrTitle[i]
	}
    }
    return "New: `"+op+"`"
}

const getTemplate = (oper, d) => {
    let from=""
    let to=""
    let body=""
    let ico=""
    let template=[]
    let symb=" ⏩" 
    let pref=""

if (oper=="account_create") {
   from=d.creator
   to=d.new_account_name
   body="Взнос: "+d.fee+"\nДелегировано: "+d.delegation
   ico="߆բ
}

if (oper=="account_metadata") {
   let a=JSON.parse(d.json_metadata)
   let obj=a.profile
//console.log(typeof obj)
   from=d.account
   to=""
   body="`"+JSON.stringify(obj)+"`"
   body=body.replaceAll(",", "\n ")
   ico="߆٢
}

if (oper=="account_update") {
   let a=JSON.parse(d.json_metadata)
   let obj=a.profile
   from=d.account
   to=d.account
   body="`"+JSON.stringify(obj)+"`"
   body=body.replaceAll(",", "\n ")
   ico="߆٢
}

if (oper=="account_witness_vote") {
    from=d.account
    to=d.witness
    body="Делегат исключён"
    ico="߆Ӣ
   if (d.approve) {
	body="Делегат выбран"
	ico="߆Ң
   }
}

if (oper=="award") {
    from=d.initiator
    to=d.receiver

    pref="ߑ͢
    if (from==to) {
	    symb=" ߔâ 
	    pref="ߑ΢
	}
	body+="⚡️Энергия: "+(d.energy/100).toFixed(2)+"%\n"+d.memo
	if (d.beneficiaries.length>0) {
	    let arr=d.beneficiaries
	    body+="\nߑŠБенефициары\n"
	    for (let i=0; i<d.beneficiaries.length>0; i++) {
	    body+=arr[i].account+" | "+(arr[i].weight/100).toFixed(2)+"%\n"
        }
    }
   ico="ߏƢ
}

if (oper=="buy_account") {
   from=d.buyer
   to=d.account
   body="Куплен за: "+d.account_offer_price
   ico="ߒբ
}

if (oper=="claim_invite_balance") {
   from=d.initiator
   to=d.receiver
   body=""
   ico="ߛĢ
}

if (oper=="committee_vote_request") {
   from=d.voter
   to="Запрос №"+d.request_id
   body="Поддержка: "+d.vote_percent/100+"%"
   ico="ߒϢ
}

if (oper=="create_invite") {
   from=d.creator
   to=d.balance
   body=""
   ico="ߚآ
}

if (oper=="custom.follow") {
   let obj=d.json
   from=obj.follower
   to=obj.following
   body=obj.what
   ico="ߍۢ
}

if (oper=="custom.media") {
    let a=JSON.parse(d.json)
//console.log("@@@", typeof a, a[1], "&&&")
   let obj=a[1]
   from=obj.author
   to=""
   body=obj.title
   ico="ߓݢ
}

if (oper=="custom.saloon.wildviz") {
   let obj=d.json[1]
   from=d.id
   to=obj.user
   body=obj.result
   ico="ߎҢ
}

if (oper=="custom.session") {
   let a=JSON.parse(d.json)
   let obj=a[1]
   from=d.required_regular_auths[0]
   to=""
   body="`"+JSON.stringify(obj)+"`"
   body=body.replaceAll(",", "\n ")
   ico="⚡"
}

if (oper=="delegate_vesting_shares") {
   from=d.delegator
   to=d.delegatee
   body=d.vesting_shares
   ico="ߒˢ
}

if (oper=="invite_registration") {
   from=d.initiator
   to=d.new_account_name
   body="Аккаунт создан"
   ico="ߚآ
}

if (oper=="paid_subscribe") {
   from=d.subscriber
   to=d.account
   body="За "+d.amount+" на "+d.period+" дн.\n"
   if (auto_renewal) {
      body+="Автопродление вкл."
   }
   ico="ߓڠ"
}

if (oper=="set_paid_subscription") {
   from=d.account
   to=d.url
   body="За "+d.amount+" на "+d.period+" дн.\n"
   ico="ߓڠ"
}

if (oper=="set_account_price") {
   from=d.account_seller
   to=d.account
   body="Цена: "+d.account_offer_price
   ico="ߒТ
}

if (oper=="set_subaccount_price") {
   from=d.subaccount_seller
   to=d.subaccount
   body="Цена: "+d.subaccount_offer_price
   ico="ߒТ
}
if (oper=="transfer") {
   from=d.from
   to=d.to
   body=d.amount+"\n"+d.memo
   ico="ߒؠ"
}
if (oper=="transfer_to_vesting") {
   from=d.from
   to=d.to
   body=d.amount
   ico="ߓȢ
}
if (oper=="versioned_chain_properties_update") {
   from=d.owner
   to=""
   body="`"+JSON.stringify(d.props[1])+"`"
   body=body.replaceAll(",", "\n ")
   ico="߆٢
}
if (oper=="withdraw_vesting") {
   from=d.account
   to=""
   body=d.vesting_shares
   ico="ߓɢ
}
if (oper=="witness_update") {
   from=d.owner
   to=""
   body=""
   ico="✨"
}

    let path=" `"+from+"`"+symb+" "+to+"\n\n"
    body="\n"+pref+path+body
    let title=ico+" "+getTitle(oper)
    let buff = {
        title:title,
        body:body,
	from:from,
	to:to
    }

    return buff
}

const makeMessage = (oper, d) => {
    let buff=getTemplate(oper, d)
//    console.log(oper,d)
    date();
    if (buff.body != "") {
	console.log(buff.title, buff.body)
	sendNotify(buff)
//	console.log("Send message")
    }
}

const getFilter = (user, buff) => {
    if (checkPermissions("users/"+user+".cfg")) {
        let lst = fs.readFileSync("users/"+user+".cfg", "utf8")
        if (lst=="") {
    	    return true // фильтра нет - значит нет
        } else {
	    let arr = lst.split(",")
	    for (let i=0; i<arr.length; i++) {
	        if (arr[i]==buff.from || arr[i]==buff.to) {
		    return true
		}
	        let str = "@@@"+buff.body
	        if (str.indexOf(arr[i])>0) {
		    return true // есть совпадение - отправка
	        }
	    }
	    return false // нет совпадения - нет отправки
	}
    } else {
        return true // нет файла - нет фильтра
    }
}

const sendNotify = (buff) => {
//    console.log(allusers)
    for (let i=1; i<allusers.length; i++) {
	if (allusers[i] != "") {
	    if (getFilter(allusers[i],buff)) {
		console.log("Send to:", allusers[i])
		bot.sendMessage(allusers[i], "v.0.7 | "+buff.title+"\n"+buff.body, opts)
	    }
	}
    }
}

String.prototype.replaceAll = function(search, replace){
  return this.split(search).join(replace);
}

/// Основной цикл
const startGetBlock = () => {

    console.log(`Starting block = ${height}`)

    let timeOut=3000
    if (retro > 0) {timeOut=30}
    timerBlock = setInterval(()=>{
// каждую минуту считываем блок
        processBlockData()
    }, timeOut)
}

const startBot = () => {
    getBlockchainState()
    .then(pluckBlockHeight)
    .then(startGetBlock)
    .catch((error)=>{console.log("vizapi: ", error)})
}

startBot() // запуск скрипта
