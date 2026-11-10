export function seed(){
  return {
    services:[
      {id:"s1",name:"Діагностика",cat:"Загальне"},
      {id:"s2",name:"Чистка і заміна термопасти",cat:"Обслуговування"},
      {id:"s3",name:"Встановлення ОС і драйверів",cat:"Програмне"},
      {id:"s4",name:"Ремонт материнської плати",cat:"Апаратне"},
      {id:"s5",name:"Заміна матриці ноутбука",cat:"Апаратне"},
      {id:"s6",name:"Відновлення даних з диска",cat:"Програмне"},
      {id:"s7",name:"Заміна клавіатури",cat:"Апаратне"},
      {id:"s8",name:"Ремонт плати MacBook",cat:"Apple"},
      {id:"s9",name:"Постачання комплектуючих",cat:"Комплектуючі"}
    ],
    parties:[
      {id:"p1",name:"ТехноПоміч (наш центр)",type:"exec",phone:"+380 67 210 44 10",email:"info@technopomich.ua",addr:"Івано-Франківськ, вул. Незалежності, 12",rating:4.7},
      {id:"p2",name:"ПлатаСервіс",type:"exec",phone:"+380 50 318 22 07",email:"plata@ukr.net",addr:"Івано-Франківськ, вул. Галицька, 41",rating:4.8},
      {id:"p3",name:"Екран-Центр",type:"exec",phone:"+380 93 455 10 91",email:"screen.if@gmail.com",addr:"Івано-Франківськ, вул. Мазепи, 8",rating:4.5},
      {id:"p4",name:"МакЛаб",type:"exec",phone:"+380 66 701 33 12",email:"maclab.if@gmail.com",addr:"Івано-Франківськ, вул. Січових Стрільців, 3",rating:4.9},
      {id:"p5",name:"ФОП Гнатюк Олег",type:"exec",phone:"+380 97 120 56 48",email:"o.hnatiuk@gmail.com",addr:"Калуш",rating:4.6},
      {id:"p6",name:"ТОВ «Комп'ютер Плюс»",type:"both",phone:"+380 34 255 90 00",email:"sales@kplus.ua",addr:"Івано-Франківськ, вул. Вовчинецька, 200",rating:4.3},
      {id:"p7",name:"Марія Коваль",type:"client",phone:"+380 68 902 11 35",email:"m.koval@gmail.com",addr:"",rating:null},
      {id:"p8",name:"Іван Петренко",type:"client",phone:"+380 95 334 78 20",email:"ivan.p@ukr.net",addr:"",rating:null},
      {id:"p10",name:"Олена Шевчук",type:"client",phone:"+380 63 418 27 90",email:"",addr:"",rating:null},
      {id:"p9",name:"ТОВ «Бюро Карпати»",type:"client",phone:"+380 34 250 17 17",email:"office@karpaty-buro.ua",addr:"Івано-Франківськ, вул. Шевченка, 5",rating:null}
    ],
    offers:[
      {p:"p1",s:"s1",price:200,days:1},{p:"p1",s:"s2",price:450,days:1},{p:"p1",s:"s3",price:600,days:1},{p:"p1",s:"s7",price:900,days:2},
      {p:"p2",s:"s1",price:250,days:1},{p:"p2",s:"s4",price:1500,days:4},
      {p:"p3",s:"s5",price:2800,days:3},{p:"p3",s:"s7",price:850,days:2},
      {p:"p4",s:"s1",price:400,days:1},{p:"p4",s:"s8",price:3900,days:5},{p:"p4",s:"s5",price:3400,days:3},
      {p:"p5",s:"s6",price:600,days:2},{p:"p5",s:"s3",price:500,days:1},
      {p:"p6",s:"s9",price:0,days:2},{p:"p6",s:"s4",price:1700,days:5}
    ],
    devices:[
      {id:"d1",owner:"p7",type:"Ноутбук",brand:"Lenovo",model:"IdeaPad 5 15ALC05",sn:"PF2K8M4Q"},
      {id:"d2",owner:"p8",type:"Ноутбук",brand:"Apple",model:"MacBook Air M1 (2020)",sn:"C02FK3XYQ6L4"},
      {id:"d3",owner:"p9",type:"ПК",brand:"Збірка",model:"Ryzen 5 5600 / 16 ГБ",sn:"BK-PC-03"},
      {id:"d4",owner:"p7",type:"ПК",brand:"HP",model:"ProDesk 400 G7",sn:"CZC0457LKP"},
      {id:"d5",owner:"p10",type:"Ноутбук",brand:"Lenovo",model:"Legion 5 15ACH6H",sn:"MP2BX9TK",note:"Подряпини на кришці, з зарядкою"}
    ],
    orders:[
      {id:"o1",num:"Р-1041",client:"p7",device:"d1",desc:"Не вмикається після падіння, розбита матриця. Потрібно зберегти фото з диска.",created:"2026-10-14",status:"work",manager:"u2"},
      {id:"o2",num:"Р-1042",client:"p8",device:"d2",desc:"Залитий кавою, не заряджається.",created:"2026-10-16",status:"work",manager:"u2"},
      {id:"o3",num:"Р-1038",client:"p9",device:"d3",desc:"Гріється і шумить, повільно працює. Перевстановити Windows.",created:"2026-10-07",status:"done",manager:"u2"},
      {id:"o5",num:"Р-1044",client:"p10",device:"d5",desc:"Клієнтка каже, що згоріла відеокарта: артефакти на екрані, потім перестав показувати зображення. Хоче поставити таку саму.",created:"2026-10-18",status:"work",manager:"u2"},
      {id:"o4",num:"Р-1043",client:"p7",device:"d4",desc:"Не вмикається, пищить при старті.",created:"2026-10-19",status:"new",manager:"u2"}
    ],
    stages:[
      {id:"t1",order:"o1",n:1,service:"s1",exec:"p1",status:"done",price:200,start:"2026-10-14",due:"2026-10-15",doneAt:"2026-10-15",concl:"Пошкоджено ланцюг живлення на материнській платі після удару, розбита матриця. Диск справний, дані можна перенести. Потрібно: ремонт плати, заміна матриці, відновлення даних."},
      {id:"t2",order:"o1",n:2,service:"s4",exec:"p2",status:"run",price:1500,start:"2026-10-16",due:"2026-10-21"},
      {id:"t3",order:"o1",n:3,service:"s5",exec:"p3",status:"asg",price:2800,start:"2026-10-19",due:"2026-10-22"},
      {id:"t4",order:"o1",n:4,service:"s6",exec:null,status:"wait",price:0,due:""},
      {id:"t5",order:"o2",n:1,service:"s1",exec:"p4",status:"done",price:400,start:"2026-10-16",due:"2026-10-17",doneAt:"2026-10-16",concl:"Сліди рідини на платі, корозія біля контролера живлення. Потрібен ремонт плати MacBook, орієнтовно 3900 грн."},
      {id:"t9",order:"o5",n:1,service:"s1",exec:"p1",status:"done",price:200,start:"2026-10-18",due:"2026-10-19",doneAt:"2026-10-19",concl:"Згорів відеочип NVIDIA RTX 3060 Laptop. Потрібно: ремонт материнської плати (заміна чипа), орієнтовно 4000 грн. Також рекомендую чистку і заміну термопасти, бо чип перегрівся через забиту систему охолодження."},
      {id:"t10",order:"o4",n:1,service:"s1",exec:null,status:"wait",price:0,due:""},
      {id:"t6",order:"o2",n:2,service:"s8",exec:"p4",status:"run",price:3900,start:"2026-10-17",due:"2026-10-22"},
      {id:"t7",order:"o3",n:1,service:"s2",exec:"p1",status:"done",price:450,start:"2026-10-07",due:"2026-10-08",doneAt:"2026-10-08"},
      {id:"t8",order:"o3",n:2,service:"s3",exec:"p1",status:"done",price:600,start:"2026-10-07",due:"2026-10-08",doneAt:"2026-10-09"}
    ],
    interactions:[
      {id:"i1",party:"p7",date:"2026-10-14",type:"Візит",text:"Принесла ноутбук, погодили діагностику."},
      {id:"i2",party:"p7",date:"2026-10-15",type:"Дзвінок",text:"Повідомили результат діагностики і вартість. Клієнтка погодилась."},
      {id:"i3",party:"p2",date:"2026-10-15",type:"Повідомлення",text:"Передали плату Lenovo IdeaPad на ремонт."},
      {id:"i4",party:"p8",date:"2026-10-16",type:"Дзвінок",text:"Клієнт описав проблему, домовились про доставку Новою поштою."}
    ],
    reviews:[
      {id:"r1",stage:"t1",exec:"p1",score:5,text:"Швидка і точна діагностика.",date:"2026-10-15",ref:"Р-1041"},
      {id:"r2",stage:"t7",exec:"p1",score:4,text:"Добре, але на день пізніше обіцяного.",date:"2026-10-08",ref:"Р-1038"},
      {id:"r3",stage:"t8",exec:"p1",score:5,text:"",date:"2026-10-09",ref:"Р-1038"},
      {id:"r4",stage:"t5",exec:"p4",score:5,text:"Знайшли причину за годину.",date:"2026-10-16",ref:"Р-1042"},
      {id:"r5",stage:null,exec:"p2",score:5,text:"Відновили плату, яку інші вважали мертвою.",date:"2026-09-22",ref:"Р-0987"},
      {id:"r6",stage:null,exec:"p2",score:5,text:"",date:"2026-09-30",ref:"Р-1003"},
      {id:"r7",stage:null,exec:"p2",score:4,text:"Якісно, але довго.",date:"2026-10-03",ref:"Р-1011"},
      {id:"r8",stage:null,exec:"p3",score:4,text:"Матриця підійшла не з першого разу.",date:"2026-09-18",ref:"Р-0979"},
      {id:"r9",stage:null,exec:"p3",score:5,text:"",date:"2026-09-27",ref:"Р-0998"},
      {id:"r10",stage:null,exec:"p3",score:4,text:"",date:"2026-10-05",ref:"Р-1019"},
      {id:"r11",stage:null,exec:"p3",score:5,text:"Замінили за день.",date:"2026-10-10",ref:"Р-1027"},
      {id:"r12",stage:null,exec:"p4",score:5,text:"",date:"2026-09-25",ref:"Р-0993"},
      {id:"r13",stage:null,exec:"p5",score:5,text:"Врятував усі фото клієнтки.",date:"2026-09-29",ref:"Р-1001"},
      {id:"r14",stage:null,exec:"p5",score:4,text:"",date:"2026-10-06",ref:"Р-1020"},
      {id:"r15",stage:null,exec:"p6",score:4,text:"",date:"2026-09-20",ref:"Р-0983"},
      {id:"r16",stage:null,exec:"p6",score:4,text:"Комплектуючі привезли із затримкою.",date:"2026-10-01",ref:"Р-1006"},
      {id:"r17",stage:null,exec:"p6",score:5,text:"",date:"2026-10-12",ref:"Р-1030"}
    ],
    users:[
      {id:"u1",name:"Наталія Бойко",login:"admin",role:"admin",party:null},
      {id:"u2",name:"Оксана Мельник",login:"oksana",role:"manager",party:null},
      {id:"u3",name:"Роман Савчук",login:"roman",role:"head",party:null},
      {id:"u4",name:"Андрій Лисак",login:"andrii",role:"master",party:"p2"},
      {id:"u5",name:"Ірина Федорак",login:"iryna",role:"master",party:"p3"},
      {id:"u6",name:"Тарас Вінтоняк",login:"taras",role:"master",party:"p1"},
      {id:"u7",name:"Олег Гнатюк",login:"oleh",role:"master",party:"p5"},
      {id:"u8",name:"Максим Дідух",login:"maksym",role:"master",party:"p4"}
    ],
    notifications:[
      {id:"n1",user:"u5",text:"Вам призначено етап «Заміна матриці ноутбука» (замовлення Р-1041)",link:"/my-stages",date:"2026-10-19",read:false}
    ],
    seq:{order:1045,id:100}
  };
}
