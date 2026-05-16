package com.x.processplatform.assemble.surface.jaxrs.review;

import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.EntityManager;
import jakarta.persistence.Tuple;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Path;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;

import com.google.gson.JsonElement;
import com.x.base.core.container.EntityManagerContainer;
import com.x.base.core.container.factory.EntityManagerContainerFactory;
import com.x.base.core.project.annotation.FieldDescribe;
import com.x.base.core.project.bean.NameValueCountPair;
import com.x.base.core.project.gson.GsonPropertyObject;
import com.x.base.core.project.http.ActionResult;
import com.x.base.core.project.http.EffectivePerson;
import com.x.base.core.project.logger.Logger;
import com.x.base.core.project.logger.LoggerFactory;
import com.x.processplatform.assemble.surface.Business;
import com.x.processplatform.core.entity.content.Review;
import com.x.processplatform.core.entity.content.Review_;

/**
 * 按应用统计当前用户可见的review数量
 * 
 * @author zhour
 *
 */
class ActionCountWithApplication extends BaseAction {

	private static final Logger LOGGER = LoggerFactory.getLogger(ActionCountWithApplication.class);

	ActionResult<Wo> execute(EffectivePerson effectivePerson, JsonElement jsonElement) throws Exception {
		ActionResult<Wo> result = new ActionResult<>();
		try (EntityManagerContainer emc = EntityManagerContainerFactory.instance().create()) {
			Business business = new Business(emc);
			Wi wi = this.convertToWrapIn(jsonElement, Wi.class);
			Wo wo = new Wo();
			EntityManager em = emc.get(Review.class);
			CriteriaBuilder cb = em.getCriteriaBuilder();
			CriteriaQuery<Tuple> cq = cb.createQuery(Tuple.class);
			Root<Review> root = cq.from(Review.class);
			Path<String> pathApplication = root.get(Review_.application);
			Path<String> pathApplicationName = root.get(Review_.applicationName);
			Predicate p = this.toFilterPredicate(effectivePerson, business, wi);
			cq.multiselect(pathApplication, pathApplicationName, cb.count(root)).where(p).groupBy(pathApplication);
			List<Tuple> os = em.createQuery(cq).getResultList();
			List<NameValueCountPair> list = new ArrayList<>();
			NameValueCountPair pair = null;
			for (Tuple o : os) {
				pair = new NameValueCountPair();
				pair.setName(o.get(pathApplicationName));
				pair.setValue(o.get(pathApplication));
				pair.setCount(o.get(2, Long.class));
				list.add(pair);
			}
			wo.setList(list);
			wo.setTotal(list.stream().mapToLong(NameValueCountPair::getCount).sum());
			result.setData(wo);
			return result;
		}
	}

	public static class Wi extends FilterWi {

	}

	public static class Wo extends GsonPropertyObject {

		@FieldDescribe("总数量")
		private Long total;

		@FieldDescribe("分类数量")
		private List<NameValueCountPair> list = new ArrayList<>();

		public Long getTotal() {
			return total;
		}

		public void setTotal(Long total) {
			this.total = total;
		}

		public List<NameValueCountPair> getList() {
			return list;
		}

		public void setList(List<NameValueCountPair> list) {
			this.list = list;
		}

	}
}