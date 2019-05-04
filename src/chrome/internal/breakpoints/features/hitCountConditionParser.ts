/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

export type HitCountConditionFunction = (numHits: number) => boolean;

export class HitCountConditionParser {
    private readonly HIT_COUNT_CONDITION_PATTERN = /^(>|>=|=|<|<=|%)?\s*([0-9]+)$/;

    constructor(private readonly _hitCountCondition: string) { }

    public parse(): HitCountConditionFunction {
        const patternMatches = this.HIT_COUNT_CONDITION_PATTERN.exec(this._hitCountCondition.trim());
        if (patternMatches && patternMatches.length >= 3) {
            // eval safe because of the regex, and this is only a string that the current user will type in
            // tslint:disable-next-line: function-constructor
            const shouldPause: HitCountConditionFunction = <any>new Function('numHits', this.javaScriptCodeToEvaluateCondition(patternMatches));
            return shouldPause;
        } else {
            throw new Error(`Didn't recognize <${this._hitCountCondition}> as a valid hit count condition`);
        }
    }

    private javaScriptCodeToEvaluateCondition(patternMatches: RegExpExecArray) {
        const operator = this.parseOperator(patternMatches);
        const value = this.parseValue(patternMatches);
        const javaScriptCode = operator === '%'
            ? `return (numHits % ${value}) === 0;`
            : `return numHits ${operator} ${value};`;
        return javaScriptCode;
    }

    private parseValue(patternMatches: RegExpExecArray): string {
        return patternMatches[2];
    }

    private parseOperator(patternMatches: RegExpExecArray): string {
        let op = patternMatches[1] || '>=';
        if (op === '=')
            op = '==';
        return op;
    }
}