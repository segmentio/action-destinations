/* eslint-disable */
// @ts-nocheck

export function initializePixel(settings) {
    const { tagId } = settings;

    (function(a,b,c,d){
        a=`//www.mczbf.com/tags/${tagId}/tag.js`;
        b=document;c='script';d=b.createElement(c);d.src=a;
        d.type='text/java'+c;d.async=true;
        d.id='cjapitag';
        a=b.getElementsByTagName(c)[0];a.parentNode.insertBefore(d,a)
        })();
}
