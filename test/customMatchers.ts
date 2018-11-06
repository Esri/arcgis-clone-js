/*
 | Copyright 2018 Esri
 |
 | Licensed under the Apache License, Version 2.0 (the "License");
 | you may not use this file except in compliance with the License.
 | You may obtain a copy of the License at
 |
 |    http://www.apache.org/licenses/LICENSE-2.0
 |
 | Unless required by applicable law or agreed to in writing, software
 | distributed under the License is distributed on an "AS IS" BASIS,
 | WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 | See the License for the specific language governing permissions and
 | limitations under the License.
 */

import MatchersUtil = jasmine.MatchersUtil;
import CustomMatcherFactories = jasmine.CustomMatcherFactories;
import CustomEqualityTester = jasmine.CustomEqualityTester;
import CustomMatcher = jasmine.CustomMatcher;
import CustomMatcherResult = jasmine.CustomMatcherResult;

//--------------------------------------------------------------------------------------------------------------------//

export interface IToHaveOrder {
  predecessor:string,
  successor:string
}

export interface CustomArrayLikeMatchers extends jasmine.ArrayLikeMatchers<string> {
  toHaveOrder(expected:any, expectationFailOutput?:any): boolean;
}

export const CustomMatchers:CustomMatcherFactories = {
  toHaveOrder: function (util: MatchersUtil, customEqualityTester: CustomEqualityTester[]): CustomMatcher {
    return {
      compare: function (actual:any, expected:IToHaveOrder): CustomMatcherResult {
        let iPredecessor = actual.indexOf(expected.predecessor);
        let iSuccessor = actual.indexOf(expected.successor);

        if (0 <= iPredecessor && iPredecessor < iSuccessor) {
          return {
            pass: true,
            message: expected.predecessor + " precedes " + expected.successor
          }
        } else {
          return {
            pass: false,
            message: "Expected " + expected.predecessor + " to precede " + expected.successor
          }
        }
      }
    }
  }
}