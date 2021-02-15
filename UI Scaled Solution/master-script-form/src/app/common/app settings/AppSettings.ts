export class AppSettings {

    public static regions: string[] = ['eu-west-1', 'us-east-1', 'us-west-1', 'us-west-2'];
    public static loadTypeNames: string[] = ['Direct', 'Proxy SharePoint', 'Direct Sharepoint', 'REST API'];
    public static endPointFieldTitles: string[] = ["ICAP Server Endpoint URL*", "SharePoint Endpoint URL*", "SharePoint Endpoint URL*", "REST API Endpoint*", "Proxy IP Address*"];
    public static endPointFieldPlaceholders: string[] = ["Ex: icap-client.region.app.provider.com", "Ex: saas1.sharepoint.com", "Ex: saas1.sharepoint.com", "Rest API Endpoint"]
    public static testNames: string[] = ["ICAP Live Performance Dashboard", "SharePoint Proxy Live Performance Dashboard", "SharePoint Direct Live Performance Dashboard", "Proxy Site Live Performance Dashboard"];
    public static dashboardNames: string[] = ["-icap-live-performance-dashboard", "-demo-dashboard-sharepoint", "-sharepoint-direct-live-performance-dashboard", "-proxysite-live-performance-dashboard"];
    public static cookiesExist: boolean;
    public static testPrefixSet = new Set<string>();
    public static addingPrefix: boolean = false;
    public static serverIp: string = "http://127.0.0.1:5000/";
}
xport enum LoadTypes { Direct = 0, ProxySharePoint, DirectSharePoint, RestApi, ProxyOffline }
export enum ReturnStatus { Success, Failure, PartialSuccess , UpdateSuccess, UpdateFailure }
