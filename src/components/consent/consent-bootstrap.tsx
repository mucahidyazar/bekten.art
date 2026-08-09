import {CONSENT_STORAGE_KEY, CONSENT_VERSION} from './model'

type ConsentBootstrapProps = {
  nonce?: string
}

const bootstrapSource = `(function(w){
  w.dataLayer=w.dataLayer||[];
  w.gtag=w.gtag||function(){w.dataLayer.push(arguments);};
  var g=w.gtag;
  g('consent','default',{
    ad_storage:'denied',
    analytics_storage:'denied',
    ad_user_data:'denied',
    ad_personalization:'denied',
    functionality_storage:'denied',
    personalization_storage:'denied',
    security_storage:'granted',
    wait_for_update:500
  });
  g('set','ads_data_redaction',true);
  g('set','url_passthrough',false);
  try {
    var raw=w.localStorage.getItem('${CONSENT_STORAGE_KEY}');
    var c=raw?JSON.parse(raw):null;
    if(c&&c.version===${CONSENT_VERSION}&&typeof c.analytics==='boolean'&&typeof c.marketing==='boolean'&&typeof c.externalMedia==='boolean'){
      g('consent','update',{
        ad_storage:c.marketing?'granted':'denied',
        analytics_storage:c.analytics?'granted':'denied',
        ad_user_data:c.marketing?'granted':'denied',
        ad_personalization:c.marketing?'granted':'denied',
        functionality_storage:c.externalMedia?'granted':'denied',
        personalization_storage:c.marketing?'granted':'denied',
        security_storage:'granted'
      });
    }
  } catch(e) {}
  w.dataLayer.push({'gtm.start':new Date().getTime(),event:'gtm.js'});
})(window);`

export function ConsentBootstrap({nonce}: ConsentBootstrapProps) {
  return (
    <script
      id="consent-mode-bootstrap"
      nonce={nonce}
      dangerouslySetInnerHTML={{__html: bootstrapSource}}
    />
  )
}
