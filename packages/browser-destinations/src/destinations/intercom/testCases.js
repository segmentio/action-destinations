/* eslint-disable @typescript-eslint/no-unsafe-call */
let analytics = {}


/* TRACK */

//track with richLinkProperty
analytics.track("product-searched", {
  product: 'surfboard',
  item: 394,
  article: {
    link : 'ur mom'
  }
})

/* GROUP */
analytics.group("0e8c78ea9d97a7b8185e8632", {
    name: "Initech",
    plan: "enterprise",
    monthlySpend: 830,
    createdAt: "2015-02-23T22:28:55.111Z"
  });

analytics.group("0e8c78ea9d97a7b8185e8632", {
  name: "Initech",
  plan: "enterprise",
  monthlySpend: 830,
  createdAt: "2015-02-23T22:28:55.111Z",
  size: 500
  }); 

  //good
  analytics.group("0e8c78ea9d97a7b8185e8632", {
    name: "Pizza Hut",
    plan: "enterprise",
    monthlySpend: 830,
    createdAt: "2015-02-23T22:28:55.111Z",
    customAttribute: 'hellloooooo',
    size: 500,
    locality: 'NY'
    }); 
  //bad
  analytics.group("0e8c78ea9d97a7b8185e8632", {
    name: "Pizza Hut",
    plan: "enterprise",
    monthlySpend: 830,
    createdAt: "2015-02-23T22:28:55.111Z",
    customAttribute: 'hellloooooo',
    size: 500,
    locality: 'NY',
    dropMe: {
      pls: 'drop me'
    }
    });


/* IDENTIFY */

analytics.identify("ln01", {
  name: "Liz Navarro",
  email: "ln@example.com",
  createdAt: "2021-09-23T22:28:55.111Z"
});

// identify with new company
analytics.identify("pg01", {
  name: "pau sanches",
  email: "ps@example.com",
  createdAt: "2021-09-23T22:28:55.111Z",
  company: {
    id: '3',
    name: 'RobustWealth'
  }
});


// identify with new company && company custom object
analytics.identify("pg01", {
  name: "pau sanches",
  email: "ps@example.com",
  createdAt: "2021-09-23T22:28:55.111Z",
  company: {
    companyId: '3',
    createdAt: "2021-09-23T22:28:55.111Z",
    name: 'RobustWealth',
    customAttr: 'drop me',
    anotherOne: {
      key: 'bro drop me lol'
    }
  }
});

// identify with avatar
analytics.identify("Flash01", {
  name: "The Flash",
  email: "flash@justiceleague.com",
  createdAt: "2018-01-23T22:28:55.111Z",
  avatar: {
    "type": "avatar", 
    "image_url" :"https://sportshub.cbsistatic.com/i/2022/02/26/1a5b7f79-f4be-4ad8-beb3-aaddccef6c94/the-flash-season-8-midseason-poster.jpg"
  }
});

// identify with company object
analytics.identify("Flash01", {
  name: "The Flash",
  email: "flash@justiceleague.com",
  createdAt: "2018-01-23T22:28:55.111Z",
  avatar: {
    "type": "avatar", 
    "image_url" :"https://sportshub.cbsistatic.com/i/2022/02/26/1a5b7f79-f4be-4ad8-beb3-aaddccef6c94/the-flash-season-8-midseason-poster.jpg"
  },
  company: {
    name: "Initech",
    plan: "enterprise",
    monthlySpend: 830,
    createdAt: "2015-02-23T22:28:55.111Z",
    size: 500
  }
});

// identify with companies array
analytics.identify("ks001", {
  name: "Kelly Slater",
  email: "ks@wsl.com",
  createdAt: "2018-01-23T22:28:55.111Z",
  avatar: {
    imageUrl :"https://www.outsideonline.com/wp-content/uploads/migrated-images_parent/migrated-images_68/kelly-slater-in-france_s.jpg"
  },
  company: {
    companyId: 'go',
    name: "Google",
    plan: "enterprise",
    monthlySpend: 10,
    createdAt: "2000-11-23T22:28:55.111Z",
    size: 100000,
    customAttr: 'dont drop me',
    anotherOne: {
      key: 'bro drop me lol'
    }
  },
  companies: [
    {  
      company: {
        companyId: 'tw13200',
        name: "Twilio",
        plan: "enterprise",
        monthlySpend: 20,
        createdAt: "2010-02-23T22:28:55.111Z",
        size: 7000,
        customAttr: 'dont drop me',
        anotherOne: {
          key: 'bro drop me lol'
        }
      }
    }, 
    { 
      company: {
        companyId: 'se10344',
        name: "Segment",
        plan: "enterprise",
        monthlySpend: 10,
        createdAt: "2012-09-23T22:28:55.111Z",
        size: 1000,
        customAttr: 'dont drop me',
        anotherOne: {
          key: 'bro drop me lol'
        }
      }
    }
  ]
}
)

