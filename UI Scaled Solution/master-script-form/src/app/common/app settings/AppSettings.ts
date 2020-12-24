export class AppSettings {

    public static regions: string[] = ['eu-west-1', 'eu-east-1', 'us-west-1', 'eu-west-2'];
    public static loadTypes: string[] = ['Direct', 'Proxy'];
    public static urlChoices: string[] = ["ICAP Server Endpoint URL*", "Proxy IP Address*"];
    public static cookiesExist: boolean;
    public static testPrefixSet = new Set<string>();
    public static addingPrefix: boolean = false;
}